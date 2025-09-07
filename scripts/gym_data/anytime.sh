#!/bin/bash
# Anytime Fitnessジムデータの投入スクリプト

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JSON_FILE="$SCRIPT_DIR/anytime.json"
SQL_FILE="$SCRIPT_DIR/anytime_insert.sql"
PYTHON_SCRIPT="$SCRIPT_DIR/anytime.py"

echo "🏋️  Anytime Fitnessジムデータ投入スクリプト"
echo "============================================="

# JSONファイルの存在確認
if [ ! -f "$JSON_FILE" ]; then
    echo "❌ エラー: $JSON_FILE が見つかりません"
    exit 1
fi

# Pythonスクリプトの存在確認
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo "❌ エラー: $PYTHON_SCRIPT が見つかりません"
    exit 1
fi

echo "📄 JSONファイル: $JSON_FILE"
echo "🐍 Pythonスクリプト: $PYTHON_SCRIPT"
echo "📝 出力SQLファイル: $SQL_FILE"
echo ""

# ジム数の確認
GYM_COUNT=$(python3 -c "import json; print(len(json.load(open('$JSON_FILE'))))")
echo "🏢 処理対象ジム数: $GYM_COUNT 件"
echo ""

# SQLファイル生成
echo "🔄 SQLファイルを生成中..."
python3 "$PYTHON_SCRIPT" > "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo "✅ SQLファイルが正常に生成されました: $SQL_FILE"
    echo ""
    echo "📋 次の手順:"
    echo "1. データベースに接続"
    echo "2. 以下のSQLファイルを実行:"
    echo "   $SQL_FILE"
    echo ""
    echo "🚀 SQL実行例 (psql):"
    echo "   psql -U your_user -d your_database -f \"$SQL_FILE\""
    echo ""
    echo "📊 生成された内容:"
    echo "   - Anytime Fitnessチェーンの追加"
    echo "   - $GYM_COUNT 件のジムデータの挿入"
    echo "   - 住所・URL・位置情報が含まれます"
else
    echo "❌ SQLファイルの生成に失敗しました"
    exit 1
fi
