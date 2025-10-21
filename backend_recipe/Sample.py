import getpass
import os
import sys
from dotenv import load_dotenv
import sqlalchemy
from sqlalchemy import create_engine, text

# --- All Imports ---
from langchain.chat_models import init_chat_model
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres.vectorstores import PGVector
from langchain_text_splitters import RecursiveCharacterTextSplitter
import psycopg
import torch

# Add this import (with fallback for different LangChain versions)
from langchain_core.documents import Document

# --- Main Application Logic ---

class RAGBOT:
    """A simple RAG bot class to encapsulate the RAG functionality."""
    def __init__(self, llm, embeddings, vector_store):
        self.llm = llm
        self.embeddings = embeddings
        self.vector_store = vector_store

    @staticmethod
    def initialize_models():
        """Initializes and returns the LLM and embedding models."""
        print("🧠 Initializing models...")
        
        # Load environment variables
        load_dotenv()
        google_api_key = os.environ.get("GEMINI_API_KEY")
        huggingface_api_key = os.environ.get("HUGGINGFACE_API_TOKEN")

        if not google_api_key:
            google_api_key = getpass.getpass("Enter API key for Google Gemini: ")
        if huggingface_api_key:
            os.environ["HUGGINGFACE_HUB_TOKEN"] = huggingface_api_key

        # Initialize LLM
        llm = init_chat_model("gemini-2.5-flash", model_provider="google_genai", api_key=google_api_key)
        
        # Initialize Embedding Model
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"   - Using device: {device}")
        embeddings = HuggingFaceEmbeddings(
            model_name="intfloat/multilingual-e5-large-instruct",
            model_kwargs={'device': device, 'token': huggingface_api_key}
        )
        
        print("   ✅ Models initialized successfully.")
        return llm, embeddings

    @staticmethod
    def setup_database_and_vector_store(embeddings):
        """Sets up the Supabase PostgreSQL database and returns a PGVector store instance."""
        print("\n🗄️ Setting up PostgreSQL vector store...")
        
        # Load environment variables
        load_dotenv()
        
        # Check if we want to use Supabase or local PostgreSQL
        use_supabase = os.environ.get("USE_SUPABASE", "true").lower() == "true"
        
        if use_supabase:
            print("   🌐 Using Supabase (cloud) database...")
            
            # Supabase connection details
            supabase_password = os.environ.get("SUPABASE_PASSWORD")
            supabase_project_id = os.environ.get("SUPABASE_PROJECT_ID")
            
            if not supabase_password or not supabase_project_id:
                print("   ❌ Missing Supabase credentials in .env file", file=sys.stderr)
                return None, None, None
                
            # Construct Supabase connection string for PGVector (needs psycopg2 format)
            connection_string = f"postgresql+psycopg2://postgres.{supabase_project_id}:{supabase_password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
            collection_name = "rag_embeddings"
            
            try:
                # Test connection and enable vector extension using psycopg (for testing)
                test_conn = psycopg.connect(f"postgresql://postgres.{supabase_project_id}:{supabase_password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres")
                with test_conn.cursor() as cursor:
                    # Enable vector extension (Supabase should have this available)
                    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                    test_conn.commit()
                test_conn.close()
                print("   ✅ Connected to Supabase and enabled vector extension.")
                
            except psycopg.OperationalError as e:
                print(f"   ❌ Supabase Connection Error: {e}", file=sys.stderr)
                return None, None, None
            except Exception as e:
                print(f"   ❌ An unexpected error occurred during Supabase setup: {e}", file=sys.stderr)
                return None, None, None
                
        else:
            print("   🏠 Using local PostgreSQL database...")
            
            # Local PostgreSQL setup (your existing code that works)
            db_password = os.environ.get("POSTGRES_PASSWORD") or getpass.getpass("Enter PostgreSQL password: ")
            db_user = os.environ.get("POSTGRES_USER", "postgres")
            db_host = os.environ.get("POSTGRES_HOST", "localhost")
            db_port = os.environ.get("POSTGRES_PORT", "5432")
            db_name = os.environ.get("POSTGRES_DB", "vectordb")
            collection_name = "rag_embeddings"

            try:
                # Create database and enable extension if they don't exist
                conn = psycopg.connect(dbname="postgres", user=db_user, password=db_password, host=db_host, port=db_port)
                conn.autocommit = True
                with conn.cursor() as cursor:
                    cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
                    if not cursor.fetchone():
                        cursor.execute(f"CREATE DATABASE {db_name}")
                        print(f"   - Database '{db_name}' created.")
                conn.close()

                # Connect to the target database to enable the extension
                conn = psycopg.connect(dbname=db_name, user=db_user, password=db_password, host=db_host, port=db_port)
                with conn.cursor() as cursor:
                    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                conn.close()
                print("   - pgvector extension is enabled.")

                connection_string = f"postgresql+psycopg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
                
            except psycopg.OperationalError as e:
                print(f"   ❌ PostgreSQL Connection Error: {e}", file=sys.stderr)
                return None, None, None
            except Exception as e:
                print(f"   ❌ An unexpected error occurred during DB setup: {e}", file=sys.stderr)
                return None, None, None

        # Initialize PGVector (works for both Supabase and local)
        try:
            vector_store = PGVector(
                embeddings=embeddings,
                connection=connection_string,
                collection_name=collection_name,
                use_jsonb=True
            )
            print("   ✅ Vector store connection successful.")
            return vector_store, collection_name, connection_string
            
        except Exception as e:
            print(f"   ❌ Failed to initialize PGVector: {e}", file=sys.stderr)
            return None, None, None

    @staticmethod
    def load_and_embed_documents(vector_store, collection_name, pdf_directory, connection_string, embeddings):
        """Loads and embeds all PDF documents from a directory into the vector store."""
        print(f"\n📄 Syncing documents from directory: {pdf_directory}")

        # List PDFs in folder
        try:
            pdf_files = [f for f in os.listdir(pdf_directory) if f.lower().endswith(".pdf")]
        except FileNotFoundError:
            print(f"   - Directory not found: {pdf_directory}")
            return vector_store

        # Get all unique source files currently in the database
        existing_pdfs = set()
        try:
            engine = create_engine(connection_string)
            with engine.connect() as conn:
                # Check if table exists
                table_exists = conn.execute(text(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'langchain_pg_embedding');"
                )).scalar()
                if table_exists:
                    # Fix: Use 'cmetadata' instead of 'metadata'
                    result = conn.execute(text(
                        "SELECT DISTINCT cmetadata->>'source_file' FROM langchain_pg_embedding WHERE cmetadata ? 'source_file';"
                    ))
                    existing_pdfs = {row[0] for row in result if row[0] is not None}
            print(f"   - Found {len(existing_pdfs)} PDF sources in database: {existing_pdfs}")
        except Exception as e:
            print(f"   - Could not check existing PDFs: {e}")
            existing_pdfs = set()

        # --- Check if any PDFs were removed ---
        removed_pdfs = existing_pdfs - set(pdf_files)
        
        if removed_pdfs:
            print(f"   🗑️ Detected {len(removed_pdfs)} removed PDF(s): {list(removed_pdfs)}")
            for pdf in removed_pdfs:
                try:
                    # Use direct SQL deletion since vector_store.delete(filter=...) might not work reliably
                    engine = create_engine(connection_string)
                    with engine.connect() as conn:
                        result = conn.execute(text(
                            "DELETE FROM langchain_pg_embedding WHERE cmetadata->>'source_file' = :filename"
                        ), {"filename": pdf})
                        conn.commit()
                        print(f"   ✅ Deleted {result.rowcount} chunks for {pdf}")
                except Exception as e:
                    print(f"   ⚠️ Error deleting {pdf}: {e}")

        # Only process new PDFs
        pdfs_to_process = [pdf for pdf in pdf_files if pdf not in existing_pdfs]
        
        if not pdfs_to_process:
            print("   ✅ All PDFs are up-to-date. No new documents to add.")
            return vector_store
        
        print(f"   📚 Processing {len(pdfs_to_process)} new PDF(s): {pdfs_to_process}")

        # Load and process PDFs
        all_docs = []
        for pdf_file in pdfs_to_process:
            pdf_path = os.path.join(pdf_directory, pdf_file)
            print(f"   - Loading: {pdf_file}")
            try:
                loader = PyMuPDFLoader(pdf_path)
                docs = loader.load()
                # Add source_file metadata for tracking
                for d in docs:
                    d.metadata = d.metadata or {}
                    d.metadata["source_file"] = pdf_file
                    d.metadata.setdefault("source", pdf_path)
                all_docs.extend(docs)
            except Exception as e:
                print(f"⚠️ Failed to load {pdf_file}: {e}")

        if not all_docs:
            print("   - Could not load any content from the PDF files.")
            return vector_store

        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""],
        )
        all_splits = text_splitter.split_documents(all_docs)

        # Add instruction prefix for the embedding model
        docs_to_embed = [
            Document(
                page_content=f"Represent this document for semantic search: {doc.page_content}",
                metadata=doc.metadata,
            ) for doc in all_splits
        ]

        # Add documents to vector store
        vector_store.add_documents(docs_to_embed)
        
        print(f"   ✅ Added {len(all_splits)} chunks from {len(pdfs_to_process)} new PDF(s).")
        
        return vector_store

    @staticmethod
    def create_rag_chain(vector_store, llm):
        """Creates the full RAG chain."""
        print("\n🔗 Creating RAG chain...")
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful assistant. You answer questions based only on the provided context. If the answer is not in the context, say 'I don't know'. And answer only in language the user asked the question."),
            ("user", "Question: {question}\n\nContext: {context}")
        ])

        rag_chain = (
            {"context": retriever, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
        print("   ✅ RAG chain created.")
        return rag_chain

    @staticmethod
    def main():
        """Main function to run the RAG application."""
        try:
            llm, embeddings = RAGBOT.initialize_models()
            vector_store, collection_name, connection_string = RAGBOT.setup_database_and_vector_store(embeddings)

            if not vector_store:
                print("\nExiting due to database connection failure.", file=sys.stderr)
                return


            # Point to the directory containing your PDFs
            pdf_directory = "e:\\Programming\\Artifical_intelligence\\CampusMitra\\Extended_Langchain_Rag\\PDFs"
            vector_store = RAGBOT.load_and_embed_documents(vector_store, collection_name, pdf_directory, connection_string, embeddings)

            rag_chain = RAGBOT.create_rag_chain(vector_store, llm)

            print("\n" + "="*60)
            print("🤖 RAG system is ready. Ask a question or type 'exit' to quit.")
            print("="*60)

            while True:
                question = input("\nAsk a question: ")
                if question.lower() in ['exit', 'quit']:
                    print("👋 Goodbye!")
                    break
                
                print("\nThinking...\n")
                response = ""
                for chunk in rag_chain.stream(question):
                    print(chunk, end="", flush=True)
                    response += chunk
                print("\n")

        except Exception as e:
            print(f"\nAn unexpected error occurred: {e}", file=sys.stderr)

if __name__ == "__main__":
    RAGBOT.main()