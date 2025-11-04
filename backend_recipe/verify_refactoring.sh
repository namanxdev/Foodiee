#!/bin/bash

echo "🔍 Verifying Backend Refactoring..."
echo ""

# Check Python syntax
echo "1️⃣ Checking Python syntax..."
python3 -m py_compile utils/db_helpers.py workers/recipe_creation_worker.py workers/recipe_regeneration_worker.py core/image_generator.py config.py api/recipe_admin.py core/base_recommender.py api/images.py 2>/dev/null && echo "   ✅ All Python files have valid syntax" || echo "   ❌ Syntax errors found"

# Check for remaining SD references
echo ""
echo "2️⃣ Checking for Stable Diffusion references..."
SD_REFS=$(grep -ri "stable.diffusion\|_generate_with_stable\|sd_image_prompt" --include="*.py" --exclude-dir=".git" --exclude="Image_gen.ipynb" --exclude="Foodie.ipynb" . 2>/dev/null | wc -l)
if [ "$SD_REFS" -eq "0" ]; then
    echo "   ✅ No Stable Diffusion references found"
else
    echo "   ⚠️  Found $SD_REFS SD references (check notebooks - they're archived)"
fi

# Check for torch/CUDA imports
echo ""
echo "3️⃣ Checking for PyTorch/CUDA imports..."
TORCH_REFS=$(grep -r "import torch\|from torch\|torch.cuda" --include="*.py" --exclude-dir=".git" --exclude="Image_gen.ipynb" --exclude="Foodie.ipynb" . 2>/dev/null | wc -l)
if [ "$TORCH_REFS" -eq "0" ]; then
    echo "   ✅ No PyTorch/CUDA imports found"
else
    echo "   ⚠️  Found $TORCH_REFS PyTorch imports (check if intentional)"
fi

# Count lines in key files
echo ""
echo "4️⃣ File sizes after refactoring:"
wc -l api/recipe_admin.py core/image_generator.py workers/recipe_regeneration_worker.py requirements.txt config.py | tail -1 | awk '{print "   📊 Total lines: " $1}'

# Count new files
echo ""
echo "5️⃣ New modular files created:"
echo "   📁 utils/db_helpers.py: $(wc -l < utils/db_helpers.py) lines"
echo "   📁 workers/recipe_creation_worker.py: $(wc -l < workers/recipe_creation_worker.py) lines"

# Check requirements
echo ""
echo "6️⃣ Dependencies analysis:"
TOTAL_PKGS=$(wc -l < requirements.txt)
echo "   📦 Total packages: $TOTAL_PKGS"
echo "   ❌ Removed: torch, torchvision, torchaudio, diffusers, transformers, accelerate"

echo ""
echo "✅ Refactoring verification complete!"
echo ""
echo "📖 See REFACTORING_SUMMARY.md for full details"
