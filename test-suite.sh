#!/bin/bash

# Digital Hazard Site - Comprehensive Test Suite

echo "=========================================="
echo "  DIGITAL HAZARD SITE TEST SUITE"
echo "=========================================="
echo ""

PASS=0
FAIL=0
WARN=0

# Test 1: HTML Structure
echo "TEST 1: HTML Structure Validation"
echo "---"
for file in index.html present.html; do
    if [ ! -f "$file" ]; then
        echo "✗ FAIL: $file not found"
        FAIL=$((FAIL + 1))
        continue
    fi

    if grep -q "<!DOCTYPE html>" "$file"; then
        echo "✓ $file has DOCTYPE"
        PASS=$((PASS + 1))
    else
        echo "✗ $file missing DOCTYPE"
        FAIL=$((FAIL + 1))
    fi

    if grep -q "</html>" "$file" && grep -q "</body>" "$file"; then
        echo "✓ $file has closing tags"
        PASS=$((PASS + 1))
    else
        echo "✗ $file missing closing tags"
        FAIL=$((FAIL + 1))
    fi
done
echo ""

# Test 2: CSS Files
echo "TEST 2: CSS Files"
echo "---"
if [ -f "css/unified.css" ]; then
    size=$(wc -l < css/unified.css)
    echo "✓ css/unified.css exists ($size lines)"
    PASS=$((PASS + 1))
else
    echo "✗ css/unified.css MISSING"
    FAIL=$((FAIL + 1))
fi

for file in index.html present.html; do
    if grep -q 'href="css/unified.css"' "$file"; then
        echo "✓ $file imports unified.css"
        PASS=$((PASS + 1))
    else
        echo "✗ $file does NOT import unified.css"
        FAIL=$((FAIL + 1))
    fi
done
echo ""

# Test 3: JavaScript Files
echo "TEST 3: JavaScript Files"
echo "---"
for jsfile in polyfills.js main-loader.js video-handler.js page-init.js game.js; do
    if [ -f "js/$jsfile" ]; then
        echo "✓ js/$jsfile exists"
        PASS=$((PASS + 1))
    else
        echo "⚠ js/$jsfile not found"
        WARN=$((WARN + 1))
    fi
done
echo ""

# Test 4: Assets
echo "TEST 4: Asset Files"
echo "---"
for asset in dh_advert.mp4 slide-intro.jpg slide-roadmap.jpg slide-finance.jpg slide-outro.jpg trailer-poster.jpg; do
    if [ -f "assets/$asset" ]; then
        echo "✓ assets/$asset exists"
        PASS=$((PASS + 1))
    else
        echo "✗ assets/$asset MISSING"
        FAIL=$((FAIL + 1))
    fi
done
echo ""

# Test 5: Fonts
echo "TEST 5: Google Fonts CDN"
echo "---"
for file in index.html present.html; do
    if grep -q "fonts.googleapis.com" "$file"; then
        echo "✓ $file uses Google Fonts CDN"
        PASS=$((PASS + 1))
    else
        echo "✗ $file missing Google Fonts"
        FAIL=$((FAIL + 1))
    fi

    if grep -q '@font-face' "$file"; then
        echo "⚠ $file still has @font-face declarations (should use CDN)"
        WARN=$((WARN + 1))
    fi
done
echo ""

# Test 6: Canvas IDs
echo "TEST 6: Canvas Elements"
echo "---"
for file in index.html present.html; do
    three_count=$(grep -c 'id="three-canvas"' "$file" 2>/dev/null || echo 0)
    demo_count=$(grep -c 'id="demo-canvas"' "$file" 2>/dev/null || echo 0)

    if [ "$three_count" -eq 1 ]; then
        echo "✓ $file has exactly 1 three-canvas"
        PASS=$((PASS + 1))
    else
        echo "✗ $file has $three_count three-canvas (expected 1)"
        FAIL=$((FAIL + 1))
    fi

    if [ "$demo_count" -eq 1 ]; then
        echo "✓ $file has exactly 1 demo-canvas"
        PASS=$((PASS + 1))
    elif [ "$demo_count" -eq 0 ]; then
        echo "⚠ $file has no demo-canvas"
        WARN=$((WARN + 1))
    else
        echo "✗ $file has $demo_count demo-canvas (expected 1)"
        FAIL=$((FAIL + 1))
    fi
done
echo ""

# Test 7: CDN Resources
echo "TEST 7: CDN Resources"
echo "---"
cdn_resources=(
    "tailwindcss/browser@4"
    "daisyui@5"
    "font-awesome"
    "fonts.googleapis.com"
    "three@latest"
)

for cdn in "${cdn_resources[@]}"; do
    if grep -q "$cdn" index.html present.html; then
        echo "✓ CDN: $cdn"
        PASS=$((PASS + 1))
    else
        echo "✗ CDN missing: $cdn"
        FAIL=$((FAIL + 1))
    fi
done
echo ""

# Test 8: Duplicate IDs
echo "TEST 8: Duplicate ID Check"
echo "---"
for file in index.html present.html; do
    duplicates=$(grep -o 'id="[^"]*"' "$file" | sort | uniq -d | wc -l)
    if [ "$duplicates" -eq 0 ]; then
        echo "✓ $file has no duplicate IDs"
        PASS=$((PASS + 1))
    else
        echo "✗ $file has $duplicates duplicate IDs:"
        grep -o 'id="[^"]*"' "$file" | sort | uniq -d
        FAIL=$((FAIL + 1))
    fi
done
echo ""

# Test 9: File Sizes
echo "TEST 9: File Size Check"
echo "---"
for file in index.html present.html; do
    size=$(wc -c < "$file")
    size_kb=$((size / 1024))
    if [ "$size_kb" -lt 200 ]; then
        echo "✓ $file is ${size_kb}KB (reasonable size)"
        PASS=$((PASS + 1))
    else
        echo "⚠ $file is ${size_kb}KB (large file)"
        WARN=$((WARN + 1))
    fi
done
echo ""

# Test 10: Removed Dependencies
echo "TEST 10: Removed Local Dependencies"
echo "---"
if [ ! -d "fonts" ]; then
    echo "✓ fonts/ directory removed (using CDN)"
    PASS=$((PASS + 1))
else
    echo "✗ fonts/ directory still exists"
    FAIL=$((FAIL + 1))
fi

if [ ! -d "static" ]; then
    echo "✓ static/ directory removed"
    PASS=$((PASS + 1))
else
    echo "⚠ static/ directory still exists"
    WARN=$((WARN + 1))
fi
echo ""

# Summary
echo "=========================================="
echo "  TEST SUMMARY"
echo "=========================================="
echo "✓ PASSED: $PASS"
echo "✗ FAILED: $FAIL"
echo "⚠ WARNINGS: $WARN"
echo ""

TOTAL=$((PASS + FAIL + WARN))
if [ "$FAIL" -eq 0 ]; then
    echo "STATUS: ALL CRITICAL TESTS PASSED ✓"
    exit 0
else
    echo "STATUS: $FAIL TESTS FAILED ✗"
    exit 1
fi
