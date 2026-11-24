#!/bin/bash
# PostToolUse: แก้ไฟล์ที่มีผลต่อ HTML ของ CV เมื่อไร สร้าง PDF CV ใหม่ทันที เว็บกับ CV จะได้ไม่หลุดกัน (CI เทียบ hash ของ HTML นี้)
# exit 2 = ส่ง stderr กลับไปให้ Claude เห็น (เช่น Chrome หายหรือ data.ts มี error) แทนที่จะเงียบไป
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in
  */src/data.ts | */scripts/build-cv.ts | */scripts/lib/chrome.ts | */scripts/assets/* | */design/logo/k-serif.svg) ;;
  *) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR" || exit 0
if ! out=$(npm run cv 2>&1); then
  echo "npm run cv ล้มเหลวหลังแก้ ${file##*/}:" >&2
  echo "$out" | tail -20 >&2
  exit 2
fi

cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"hook รัน npm run cv ให้แล้ว ถ้าแก้ profile (firstName/lastName/focus/role/school/availability/siteUrl) หรือ 3 อันแรกของ highlights ให้รัน npm run og ด้วย เพราะรูป og-image ใช้ค่าเหล่านี้ commit PDF คู่กับ src/assets/cv.sha256"}}
JSON
