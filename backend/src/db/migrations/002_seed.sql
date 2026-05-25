-- Seed reference data: pickup points + sample academic programs.

INSERT INTO pickup_points (code, name, latitude, longitude, is_destination, sort_order) VALUES
    ('CARREFOUR_TKC',  'Carrefour TKC',   3.8520000, 11.5180000, FALSE, 1),
    ('CARREFOUR_MEEC', 'Carrefour MEEC',  3.8610000, 11.5210000, FALSE, 2),
    ('VOGT',           'Vogt',            3.8680000, 11.5260000, FALSE, 3),
    ('POSTE_CENTRALE', 'Poste Centrale',  3.8700000, 11.5230000, FALSE, 4),
    ('FAMASSI',        'Famassi',         3.8750000, 11.5300000, FALSE, 5),
    ('EYANG',          'Eyang',           3.8830000, 11.5400000, TRUE,  99)
ON CONFLICT (code) DO NOTHING;

INSERT INTO academic_programs (code, level, field) VALUES
    ('L1-INFO',  'L1', 'Informatique'),
    ('L1-ELEC',  'L1', 'Électrique'),
    ('L1-MECA',  'L1', 'Mécanique'),
    ('L1-CIVI',  'L1', 'Génie Civil'),
    ('L2-INFO',  'L2', 'Informatique'),
    ('L2-ELEC',  'L2', 'Électrique'),
    ('L2-MECA',  'L2', 'Mécanique'),
    ('L2-CIVI',  'L2', 'Génie Civil'),
    ('L3-INFO',  'L3', 'Informatique'),
    ('L3-ELEC',  'L3', 'Électrique'),
    ('L3-MECA',  'L3', 'Mécanique'),
    ('L3-CIVI',  'L3', 'Génie Civil'),
    ('M1-INFO',  'M1', 'Informatique'),
    ('M1-CIVI',  'M1', 'Génie Civil'),
    ('M2-INFO',  'M2', 'Informatique'),
    ('M2-CIVI',  'M2', 'Génie Civil')
ON CONFLICT (code) DO NOTHING;
