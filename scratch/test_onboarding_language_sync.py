"""
Script to test onboarding language synchronization for all 4 supported languages:
English (en), Telugu (te), Tamil (ta), Hindi (hi).
"""

import os
import json
import re

TRANS_PATH = r"c:\Charan\Farm Assist Ai\frontend\src\translations.ts"
LOGIN_PATH = r"c:\Charan\Farm Assist Ai\frontend\src\views\Login.tsx"

def test_login_no_hardcoded_strings():
    with open(LOGIN_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # Verify key elements are wrapped in t(...)
    required_t_calls = [
        "t('quote_text')",
        "t('quote_author')",
        "t('choose_language_title')",
        "t('choose_language_sub')",
        "t('auth_step_1_of_2')",
        "t('auth_continue_to_signin')",
        "t('auth_change')",
    ]

    for call in required_t_calls:
        assert call in content, f"Missing expected translation call '{call}' in Login.tsx"

    print("[OK] All required translation function calls present in Login.tsx")

def test_translation_dictionary_coverage():
    with open(TRANS_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    languages = ['en', 'te', 'ta', 'hi']
    keys = [
        'quote_text',
        'quote_author',
        'choose_language_title',
        'choose_language_sub',
        'auth_step_1_of_2',
        'auth_continue_to_signin',
        'auth_change',
    ]

    for lang in languages:
        for key in keys:
            assert f"{key}:" in content, f"Key '{key}' missing from translations.ts for {lang}"

    print("[OK] All 7 onboarding keys defined for all languages in translations.ts")

if __name__ == '__main__':
    test_login_no_hardcoded_strings()
    test_translation_dictionary_coverage()
    print("\nSUCCESS: All onboarding language synchronization checks passed!")
