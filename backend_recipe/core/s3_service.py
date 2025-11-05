"""
AWS S3 Service for Recipe Images
=================================
Handles uploading, downloading, and managing recipe images in S3
Uses boto3 for AWS operations
"""

import os
import base64
import re
from typing import Optional, Tuple
from io import BytesIO
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Try to import boto3, but make it optional for local dev
try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    print("⚠️  boto3 not installed. Install with: pip install boto3")


class S3Service:
    """
    AWS S3 service for uploading and managing recipe images
    
    S3 Structure:
    oldowan-recipe-images-2025/
        Curated/
            {recipe_name}_{recipe_id}/
                {recipe_name}_main.jpg          # Main cover image
                {recipe_name}_step1.jpg         # Step images
                {recipe_name}_step2.jpg
                archive/                        # Versioned old images
                    {recipe_name}_main_20251031_143022.jpg
    """
    
    def __init__(self):
        """Initialize S3 client with credentials from environment"""
        if not BOTO3_AVAILABLE:
            raise ImportError("boto3 is required. Install with: pip install boto3")
        
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.bucket_name = os.getenv("AWS_S3_BUCKET_NAME", "oldowan-recipe-images-2025")
        self.base_path = "Curated"
        
        # Validate credentials
        if not self.aws_access_key or not self.aws_secret_key:
            raise ValueError(
                "AWS credentials not found. "
                "Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env"
            )
        
        # Initialize S3 client
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=self.aws_access_key,
            aws_secret_access_key=self.aws_secret_key,
            region_name=self.aws_region
        )
        
        print(f"✅ S3 Service initialized - Bucket: {self.bucket_name}, Region: {self.aws_region}")
    
    # ========================================================================
    # Main Upload Methods
    # ========================================================================
    
    def upload_recipe_main_image(
        self,
        recipe_id: int,
        recipe_name: str,
        image_base64: str,
        archive_existing: bool = True
    ) -> str:
        """
        Upload main recipe cover image to S3
        
        Args:
            recipe_id: Recipe ID
            recipe_name: Recipe name (will be sanitized)
            image_base64: Base64 encoded image string
            archive_existing: If True, move existing image to archive/ folder
            
        Returns:
            Public S3 URL of uploaded image
            
        Raises:
            Exception: If upload fails
        """
        # Generate S3 key
        sanitized_name = self._sanitize_recipe_name(recipe_name)
        folder_name = f"{sanitized_name}_{recipe_id}"
        s3_key = f"{self.base_path}/{folder_name}/{sanitized_name}_main.jpg"
        
        # Archive existing image if requested
        if archive_existing:
            self._archive_existing_image(s3_key)
        
        # Upload to S3
        public_url = self._upload_base64_to_s3(image_base64, s3_key)
        
        print(f"   ✅ Uploaded main image: {public_url}")
        return public_url
    
    def upload_recipe_ingredients_image(
        self,
        recipe_id: int,
        recipe_name: str,
        image_base64: str,
        archive_existing: bool = True
    ) -> str:
        """
        Upload ingredients image to S3
        
        Args:
            recipe_id: Recipe ID
            recipe_name: Recipe name (will be sanitized)
            image_base64: Base64 encoded image string
            archive_existing: If True, move existing image to archive/ folder
            
        Returns:
            Public S3 URL of uploaded image
        """
        # Generate S3 key
        sanitized_name = self._sanitize_recipe_name(recipe_name)
        folder_name = f"{sanitized_name}_{recipe_id}"
        s3_key = f"{self.base_path}/{folder_name}/{sanitized_name}_ingredients.jpg"
        
        # Archive existing image if requested
        if archive_existing:
            self._archive_existing_image(s3_key)
        
        # Upload to S3
        public_url = self._upload_base64_to_s3(image_base64, s3_key)
        
        print(f"   ✅ Uploaded ingredients image: {public_url}")
        return public_url
    
    def upload_recipe_step_image(
        self,
        recipe_id: int,
        recipe_name: str,
        step_index: int,
        image_base64: str,
        archive_existing: bool = True,
        step_type: str = "original"
    ) -> str:
        """
        Upload step image to S3 with support for beginner/advanced variants
        
        Args:
            recipe_id: Recipe ID
            recipe_name: Recipe name (will be sanitized)
            step_index: Step number (1-based)
            image_base64: Base64 encoded image string
            archive_existing: If True, move existing image to archive/ folder
            step_type: Type of step image - 'original', 'beginner', or 'advanced'
            
        Returns:
            Public S3 URL of uploaded image
        """
        # Generate S3 key based on step_type
        sanitized_name = self._sanitize_recipe_name(recipe_name)
        folder_name = f"{sanitized_name}_{recipe_id}"
        
        if step_type == "beginner":
            s3_key = f"{self.base_path}/{folder_name}/steps_beginner/step_{step_index}.jpg"
        elif step_type == "advanced":
            s3_key = f"{self.base_path}/{folder_name}/steps_advanced/step_{step_index}.jpg"
        else:  # original or default
            s3_key = f"{self.base_path}/{folder_name}/{sanitized_name}_step{step_index}.jpg"
        
        # Archive existing image if requested
        if archive_existing:
            self._archive_existing_image(s3_key)
        
        # Upload to S3
        public_url = self._upload_base64_to_s3(image_base64, s3_key)
        
        step_type_label = f" ({step_type})" if step_type != "original" else ""
        print(f"   ✅ Uploaded step {step_index}{step_type_label} image: {public_url}")
        return public_url
    
    # ========================================================================
    # User-Generated Image Methods
    # ========================================================================
    
    def upload_user_generated_step_image(
        self,
        user_email: str,
        session_id: str,
        dish_name: str,
        step_index: int,
        image_base64: str
    ) -> str:
        """
        Upload user-generated step image to S3
        
        Structure: user_generated/<email>/<session_id>/<dish_name>_step_{i}
        
        Args:
            user_email: User's email address (sanitized for S3 key)
            session_id: Session identifier
            dish_name: Name of the dish/recipe
            step_index: Step number (1-based)
            image_base64: Base64 encoded image string
            
        Returns:
            Public S3 URL of uploaded image
        """
        # Sanitize inputs
        sanitized_email = self._sanitize_email(user_email)
        sanitized_dish = self._sanitize_recipe_name(dish_name)
        sanitized_session = self._sanitize_session_id(session_id)
        
        # Generate S3 key: user_generated/<email>/<session_id>/<dish_name>_step_{i}
        s3_key = f"user_generated/{sanitized_email}/{sanitized_session}/{sanitized_dish}_step_{step_index}.jpg"
        
        # Upload to S3 (no archiving for user-generated images)
        public_url = self._upload_base64_to_s3(image_base64, s3_key)
        
        print(f"   ✅ Uploaded user-generated step {step_index} image: {public_url}")
        return public_url
    
    def _sanitize_email(self, email: str) -> str:
        """
        Sanitize email address for use in S3 keys
        
        Args:
            email: Email address
            
        Returns:
            Sanitized email (lowercase, @ replaced with _, special chars removed)
        """
        # Convert to lowercase
        sanitized = email.lower()
        
        # Replace @ with _at_ and other special chars with underscores
        sanitized = sanitized.replace('@', '_at_')
        sanitized = re.sub(r'[^a-z0-9_]+', '_', sanitized)
        
        # Remove leading/trailing underscores
        sanitized = sanitized.strip('_')
        
        # Limit length
        if len(sanitized) > 100:
            sanitized = sanitized[:100]
        
        return sanitized
    
    def _sanitize_session_id(self, session_id: str) -> str:
        """
        Sanitize session ID for use in S3 keys
        
        Args:
            session_id: Session identifier
            
        Returns:
            Sanitized session ID
        """
        # Remove any special characters, keep alphanumeric and underscores
        sanitized = re.sub(r'[^a-zA-Z0-9_]+', '_', session_id)
        
        # Remove leading/trailing underscores
        sanitized = sanitized.strip('_')
        
        # Limit length
        if len(sanitized) > 50:
            sanitized = sanitized[:50]
        
        return sanitized
    
    # ========================================================================
    # Helper Methods
    # ========================================================================
    
    def _upload_base64_to_s3(self, image_base64: str, s3_key: str) -> str:
        """
        Upload base64 encoded image to S3
        
        Args:
            image_base64: Base64 encoded image string
            s3_key: Full S3 key path
            
        Returns:
            Public S3 URL
        """
        try:
            # Decode base64 to bytes
            image_bytes = base64.b64decode(image_base64)
            
            # Upload to S3 (without ACL - bucket should be configured for public read)
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=image_bytes,
                ContentType='image/jpeg'
            )
            
            # Generate public URL
            public_url = f"https://{self.bucket_name}.s3.{self.aws_region}.amazonaws.com/{s3_key}"
            return public_url
            
        except NoCredentialsError:
            raise Exception("AWS credentials not found or invalid")
        except ClientError as e:
            raise Exception(f"S3 upload failed: {e}")
        except Exception as e:
            raise Exception(f"Image upload error: {e}")
    
    def _archive_existing_image(self, s3_key: str) -> bool:
        """
        Move existing image to archive/ folder with timestamp
        
        Args:
            s3_key: S3 key of existing image
            
        Returns:
            True if archived, False if image doesn't exist
        """
        try:
            # Check if image exists
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            
            # Generate archive key with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            path_parts = s3_key.rsplit('/', 1)
            folder = path_parts[0]
            filename = path_parts[1]
            filename_without_ext = filename.rsplit('.', 1)[0]
            archive_key = f"{folder}/archive/{filename_without_ext}_{timestamp}.jpg"
            
            # Copy to archive
            self.s3_client.copy_object(
                Bucket=self.bucket_name,
                CopySource={'Bucket': self.bucket_name, 'Key': s3_key},
                Key=archive_key
            )
            
            print(f"   📦 Archived existing image to: {archive_key}")
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                # Image doesn't exist, no need to archive
                return False
            else:
                print(f"   ⚠️  Archive warning: {e}")
                return False
    
    def _sanitize_recipe_name(self, recipe_name: str) -> str:
        """
        Sanitize recipe name for use in S3 keys
        
        Args:
            recipe_name: Original recipe name
            
        Returns:
            Sanitized name (lowercase, underscores, alphanumeric)
        """
        # Convert to lowercase
        name = recipe_name.lower()
        
        # Replace spaces and special chars with underscores
        name = re.sub(r'[^a-z0-9]+', '_', name)
        
        # Remove leading/trailing underscores
        name = name.strip('_')
        
        # Limit length to 50 characters
        if len(name) > 50:
            name = name[:50]
        
        return name
    
    def check_image_exists(self, s3_key: str) -> bool:
        """
        Check if an image exists in S3
        
        Args:
            s3_key: S3 key to check
            
        Returns:
            True if exists, False otherwise
        """
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError:
            return False
    
    def delete_image(self, s3_key: str) -> bool:
        """
        Delete an image from S3
        
        Args:
            s3_key: S3 key to delete
            
        Returns:
            True if deleted successfully
        """
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            print(f"   🗑️  Deleted: {s3_key}")
            return True
        except ClientError as e:
            print(f"   ❌ Delete failed: {e}")
            return False
    
    def get_public_url(self, recipe_id: int, recipe_name: str, image_type: str = "main", step_index: int = None) -> str:
        """
        Generate public URL for an image
        
        Args:
            recipe_id: Recipe ID
            recipe_name: Recipe name
            image_type: 'main' or 'step'
            step_index: Step number (required if image_type='step')
            
        Returns:
            Public S3 URL
        """
        sanitized_name = self._sanitize_recipe_name(recipe_name)
        folder_name = f"{sanitized_name}_{recipe_id}"
        
        if image_type == "main":
            s3_key = f"{self.base_path}/{folder_name}/{sanitized_name}_main.jpg"
        elif image_type == "step":
            if step_index is None:
                raise ValueError("step_index required for step images")
            s3_key = f"{self.base_path}/{folder_name}/{sanitized_name}_step{step_index}.jpg"
        else:
            raise ValueError(f"Invalid image_type: {image_type}")
        
        return f"https://{self.bucket_name}.s3.{self.aws_region}.amazonaws.com/{s3_key}"


# ============================================================================
# Module-level convenience functions
# ============================================================================

_s3_service_instance = None

def get_s3_service() -> S3Service:
    """Get or create singleton S3 service instance"""
    global _s3_service_instance
    if _s3_service_instance is None:
        _s3_service_instance = S3Service()
    return _s3_service_instance
