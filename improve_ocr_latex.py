#!/usr/bin/env python3
"""
Améliore le texte OCR en détectant et formatant les formules mathématiques en LaTeX
"""
import re
import sys
from pathlib import Path

def detect_and_wrap_math(text):
    """
    Détecte les expressions mathématiques et les entoure de délimiteurs LaTeX.
    """
    
    # Pattern pour détecter les expressions mathématiques communes
    math_patterns = [
        # Fractions avec /
        (r'([a-zA-Z0-9_]+)\s*/\s*([a-zA-Z0-9_]+)', r'$\1/\2$'),
        
        # Symboles grecs déjà en LaTeX (\Delta, \alpha, etc.)
        (r'\\(Delta|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|omega|Omega|Gamma|Theta|Lambda|Pi|Sigma)', r'$\\\1$'),
        
        # Indices avec underscore (n_0, x_i, etc.)
        (r'\b([a-zA-Z])_([a-zA-Z0-9]+)\b', r'$\1_{\2}$'),
        
        # Exposants déjà marqués (x^2, 10^-2, etc.)
        (r'([a-zA-Z0-9]+)\^([0-9\-+]+)', r'$\1^{\2}$'),
        
        # Équations simples (a = b, x + y = z)
        (r'([a-zA-Z0-9_\(\)]+)\s*([=<>≤≥≠])\s*([a-zA-Z0-9_\(\)\+\-\*/\^]+)', r'$\1 \2 \3$'),
    ]
    
    result = text
    
    # Appliquer les patterns
    for pattern, replacement in math_patterns:
        result = re.sub(pattern, replacement, result)
    
    # Nettoyer les doubles délimiteurs
    result = re.sub(r'\$\s*\$', r'$', result)
    
    # Fusionner les expressions math adjacentes
    result = re.sub(r'\$\s+\$', r' ', result)
    
    return result

def improve_ocr_text(input_path, output_path=None):
    """
    Améliore le texte OCR avec formatage LaTeX.
    
    Args:
        input_path: Chemin vers le fichier OCR brut
        output_path: Chemin de sortie (optionnel)
    """
    input_path = Path(input_path)
    
    if not input_path.exists():
        print(f"Erreur: Fichier non trouvé: {input_path}")
        return False
    
    # Lire le contenu
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Améliorer le texte
    improved = detect_and_wrap_math(content)
    
    # Déterminer le chemin de sortie
    if output_path is None:
        output_path = input_path.parent / f"{input_path.stem}_latex{input_path.suffix}"
    else:
        output_path = Path(output_path)
    
    # Sauvegarder
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(improved)
    
    print(f"✓ Texte amélioré sauvegardé: {output_path}")
    print(f"  Original: {len(content)} caractères")
    print(f"  Amélioré: {len(improved)} caractères")
    
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python improve_ocr_latex.py <input_file> [output_file]")
        print("Exemple: python improve_ocr_latex.py chemistry_ocr.txt chemistry_latex.txt")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    improve_ocr_text(input_file, output_file)
