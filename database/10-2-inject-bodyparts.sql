-- 鍛えたい部位マスタデータの投入
-- bodyparts_master テーブルに身体部位を追加

INSERT INTO bodyparts_master (pub_id, bodypart) VALUES
(gen_nanoid_21(), '胸筋'),
(gen_nanoid_21(), '背中'),
(gen_nanoid_21(), '肩'),
(gen_nanoid_21(), '上腕二頭筋'),
(gen_nanoid_21(), '上腕三頭筋'),
(gen_nanoid_21(), '前腕'),
(gen_nanoid_21(), '腹筋'),
(gen_nanoid_21(), '大腿四頭筋'),
(gen_nanoid_21(), 'ハムストリング'),
(gen_nanoid_21(), '臀筋'),
(gen_nanoid_21(), 'ふくらはぎ'),
(gen_nanoid_21(), '体幹'),
(gen_nanoid_21(), '全身');
