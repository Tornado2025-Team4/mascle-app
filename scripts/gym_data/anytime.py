#!/usr/bin/env python3
"""
Anytime Fitnessのジムデータを処理してSQLを生成するスクリプト
JSONファイルからジムデータを読み込み、PostgreSQL用のINSERT文を生成します。
"""

import json
import os
import sys

def generate_sql():
    """JSONデータからSQL文を生成"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_file = os.path.join(script_dir, "anytime.json")

    if not os.path.exists(json_file):
        print(f"エラー: {json_file} が見つかりません")
        sys.exit(1)

    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            gyms_data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"JSONパースエラー: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ファイル読み込みエラー: {e}")
        sys.exit(1)

    if not gyms_data:
        print("エラー: ジムデータが空です")
        sys.exit(1)

    print(f"-- Anytime Fitnessジムデータ: {len(gyms_data)}件のジムを処理中...")
    print()

    # 1. ジムチェーンマスターの挿入
    print("-- 1. ジムチェーンマスターにAnytime Fitnessを追加")
    print("INSERT INTO gymchains_master (pub_id, name) VALUES")
    print("(gen_nanoid_21(), 'Anytime Fitness');")
    print()

    # 2. ジムデータの挿入
    print("-- 2. ジムデータの挿入")
    print("-- ジムチェーンIDを取得してジムを挿入")
    print("WITH anytime_chain AS (")
    print("    SELECT rel_id FROM gymchains_master WHERE name = 'Anytime Fitness'")
    print(")")
    print("INSERT INTO gyms_master (")
    print("    pub_id,")
    print("    name,")
    print("    gymchain_rel_id,")
    print("    gymchain_internal_id,")
    print("    location")
    print(")")
    print("SELECT * FROM (VALUES")

    # 各ジムのデータを処理
    for i, gym in enumerate(gyms_data):
        try:
            name = gym['name'].replace("'", "''")  # シングルクオートをエスケープ
            address = gym['address'].replace("'", "''")
            url = gym['url'].replace("'", "''")
            lat = float(gym['latitude'])
            lng = float(gym['longitude'])

            # gymchain_internal_idにアドレスとURLを格納
            internal_id = {
                "address": gym['address'],
                "url": gym['url']
            }
            internal_id_json = json.dumps(internal_id, ensure_ascii=False).replace("'", "''")

            # PostGISのポイント形式でlocationを作成
            location = f"ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326)"

            comma = "," if i < len(gyms_data) - 1 else ""
            print(f"    (gen_nanoid_21(), '{name}', (SELECT rel_id FROM anytime_chain), '{internal_id_json}'::jsonb, {location}){comma}")

        except (KeyError, ValueError) as e:
            print(f"-- 警告: ジムデータのスキップ - {gym.get('name', '名前不明')}: {e}", file=sys.stderr)
            continue

    print(") AS gym_data(pub_id, name, gymchain_rel_id, gymchain_internal_id, location);")
    print()

    print("-- 処理完了!")
    print(f"-- 総ジム数: {len(gyms_data)}件")

if __name__ == "__main__":
    generate_sql()
