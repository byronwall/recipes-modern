UPDATE "Ingredient"
SET "aisle" = NULLIF(
    trim(
        regexp_replace(
            initcap(regexp_replace("aisle", '[-_]+', ' ', 'g')),
            '[[:space:]]+',
            ' ',
            'g'
        )
    ),
    ''
)
WHERE "aisle" IS NOT NULL
  AND "aisle" <> '';
