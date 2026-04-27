WITH normalized_aisles AS (
    SELECT
        "id",
        NULLIF(
            array_to_string(
                ARRAY(
                    SELECT upper(left(word, 1)) || substring(word FROM 2)
                    FROM unnest(
                        regexp_split_to_array(
                            lower(
                                trim(
                                    regexp_replace(
                                        regexp_replace("aisle", '[-_]+', ' ', 'g'),
                                        '[[:space:]]+',
                                        ' ',
                                        'g'
                                    )
                                )
                            ),
                            ' '
                        )
                    ) AS word
                ),
                ' '
            ),
            ''
        ) AS "aisle"
    FROM "Ingredient"
    WHERE "aisle" IS NOT NULL
      AND "aisle" <> ''
)
UPDATE "Ingredient"
SET "aisle" = normalized_aisles."aisle"
FROM normalized_aisles
WHERE "Ingredient"."id" = normalized_aisles."id";
