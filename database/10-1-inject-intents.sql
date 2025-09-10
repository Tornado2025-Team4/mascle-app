-- トレーニング目的マスタデータの投入
-- intents_master テーブルにトレーニング目的を追加

INSERT INTO intents_master (pub_id, intent) VALUES
(gen_nanoid_21(), '筋力向上'),
(gen_nanoid_21(), '筋肥大'),
(gen_nanoid_21(), '減量・ダイエット'),
(gen_nanoid_21(), '体力向上'),
(gen_nanoid_21(), '健康維持'),
(gen_nanoid_21(), 'リハビリ'),
(gen_nanoid_21(), 'ボディメイク'),
(gen_nanoid_21(), '競技力向上'),
(gen_nanoid_21(), 'ストレス解消'),
(gen_nanoid_21(), '姿勢改善'),
(gen_nanoid_21(), '柔軟性向上'),
(gen_nanoid_21(), '基礎代謝向上');
