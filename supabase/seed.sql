-- Dados iniciais do MVP.
-- Execute depois de schema.sql. Seguro para rodar mais de uma vez
-- (usa DELETE + INSERT para tasks/patients/caregivers "seed", nunca
-- toca em shifts/task_executions, que são o histórico real).

-- =========================================================
-- Paciente (MVP: um único paciente)
-- =========================================================
insert into patients (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Paciente')
on conflict (id) do update set name = excluded.name;

-- =========================================================
-- Cuidadores (MVP: sem cadastro complexo, apenas seleção simples)
-- =========================================================
insert into caregivers (id, name) values
  ('00000000-0000-0000-0000-000000000101', 'Cuidador 1'),
  ('00000000-0000-0000-0000-000000000102', 'Cuidador 2'),
  ('00000000-0000-0000-0000-000000000103', 'Cuidador 3')
on conflict (id) do update set name = excluded.name;

-- =========================================================
-- Rotina diária de tarefas
--
-- Nomes, horários, quantidades e instruções reproduzidos exatamente
-- como cadastrados. Nenhuma recomendação médica é feita aqui.
-- =========================================================

delete from tasks where patient_id = '00000000-0000-0000-0000-000000000001';

insert into tasks (patient_id, scheduled_time, title, category, instructions, sort_order) values
('00000000-0000-0000-0000-000000000001', '06:00', 'Dieta', 'dieta', 'Instalar 200 ml de dieta com 1 colher de azeite.', 10),

('00000000-0000-0000-0000-000000000001', '07:00', 'Higiene', 'higiene', 'Realizar higiene íntima com sabonete próprio.', 20),
('00000000-0000-0000-0000-000000000001', '07:00', 'Medicações', 'medicacao', 'Pantoprazol 20 mg; Domperidona 1 cp; Memantina 10 mg; Metformina 500 mg. Diluir todas essas medicações juntas em 10 ml de água e lavar a sonda com 30 ml de água após administração.', 21),
('00000000-0000-0000-0000-000000000001', '07:00', 'Higiene oral', 'higiene_oral', 'Realizar higiene oral e pingar 4 gotas de atropina em cada lado da bochecha.', 22),
('00000000-0000-0000-0000-000000000001', '07:00', 'Inalação', 'inalacao', '5 ml de soro e 5 gotas de Buscopan.', 23),
('00000000-0000-0000-0000-000000000001', '07:00', 'Mudança de decúbito', 'mudanca_decubito', 'Realizar conforme relógio da parede.', 24),

('00000000-0000-0000-0000-000000000001', '08:00', 'Água', 'agua', 'Instalar 240 ml de água.', 30),

('00000000-0000-0000-0000-000000000001', '09:00', 'Mudança de decúbito', 'mudanca_decubito', 'Realizar conforme relógio da parede.', 40),
('00000000-0000-0000-0000-000000000001', '09:10', 'Hidratação', 'hidratacao', 'Realizar hidratação com hidratante e massagem corporal.', 41),
('00000000-0000-0000-0000-000000000001', '09:20', 'Exercícios', 'exercicios', 'Realizar exercícios físicos para estimulação motora.', 42),

('00000000-0000-0000-0000-000000000001', '10:00', 'Dieta', 'dieta', 'Instalar 200 ml de dieta com 1 colher de azeite.', 50),

('00000000-0000-0000-0000-000000000001', '11:00', 'Medicação', 'medicacao', '4 comprimidos de aciclovir diluído em 10 ml de água.', 60),
('00000000-0000-0000-0000-000000000001', '11:00', 'Mudança de decúbito', 'mudanca_decubito', 'Realizar conforme relógio da parede.', 61),
('00000000-0000-0000-0000-000000000001', '11:20', 'Banho', 'banho', 'Realizar banho de aspersão com auxílio da cadeira de banho. Realizar higiene oral. Realizar hidratação corporal.', 62),

('00000000-0000-0000-0000-000000000001', '12:00', 'Água', 'agua', 'Instalar 240 ml de água.', 70),
('00000000-0000-0000-0000-000000000001', '12:00', 'Medicação', 'medicacao', 'Metformina 500 mg, diluído em 5 ml de água.', 71),

('00000000-0000-0000-0000-000000000001', '13:00', 'Mudança de decúbito', 'mudanca_decubito', 'Realizar conforme relógio da parede.', 80),

('00000000-0000-0000-0000-000000000001', '14:00', 'Dieta', 'dieta', 'Instalar 200 ml de dieta com 1 colher de azeite.', 90),
('00000000-0000-0000-0000-000000000001', '14:00', 'Medicação', 'medicacao', 'Domperidona 1 cp, diluído em 5 ml de água.', 91),
('00000000-0000-0000-0000-000000000001', '14:00', 'Higiene oral', 'higiene_oral', 'Realizar higiene oral e pingar 4 gotas de atropina em cada lado da bochecha.', 92),

('00000000-0000-0000-0000-000000000001', '15:00', 'Medicação', 'medicacao', '4 comprimidos de aciclovir diluído em 10 ml de água.', 100),
('00000000-0000-0000-0000-000000000001', '15:00', 'Mudança de decúbito', 'mudanca_decubito', 'Realizar conforme relógio da parede.', 101),
('00000000-0000-0000-0000-000000000001', '15:20', 'Banho de sol', 'banho_sol', 'Descer com auxílio de cadeira de rodas para a área de lazer do condomínio para banho de sol.', 102),

('00000000-0000-0000-0000-000000000001', '16:00', 'Água', 'agua', 'Instalar 240 ml de água.', 110),
('00000000-0000-0000-0000-000000000001', '16:10', 'Estimulação', 'estimulacao', 'Colocar na poltrona e realizar estimulação oral e motora com desenhos para pintar.', 111),
('00000000-0000-0000-0000-000000000001', '16:30', 'Medicação', 'medicacao', 'Ciclobenzaprina 5 mg, diluído em 5 ml de água.', 112),

('00000000-0000-0000-0000-000000000001', '17:00', 'Mudança de decúbito', 'mudanca_decubito', 'Realizar conforme relógio da parede.', 120),

('00000000-0000-0000-0000-000000000001', '18:00', 'Dieta', 'dieta', 'Instalar 200 ml de dieta com 1 colher de azeite.', 130),
('00000000-0000-0000-0000-000000000001', '18:00', 'Medicações', 'medicacao', 'Metformina 500 mg; Memantina 10 mg. Diluir essas medicações em 10 ml de água.', 131),
('00000000-0000-0000-0000-000000000001', '18:00', 'Inalação', 'inalacao', '5 ml de soro + 5 gotas de Buscopan.', 132),
('00000000-0000-0000-0000-000000000001', '18:00', 'Higiene oral', 'higiene_oral', 'Realizar higiene oral e pingar 4 gotas de atropina em cada lado da bochecha.', 133),

('00000000-0000-0000-0000-000000000001', '18:30', 'Higiene', 'higiene', 'Realizar a última higienização íntima. Passar pomada de assadura. Na última troca colocar duas fraldas: uma como absorvente; uma normal. Realizar hidratação corporal.', 140),

('00000000-0000-0000-0000-000000000001', '19:00', 'Medicação', 'medicacao', '4 comprimidos de aciclovir diluído em 10 ml de água.', 150),
('00000000-0000-0000-0000-000000000001', '19:00', 'Mudança de decúbito', 'mudanca_decubito', 'Realizar conforme relógio da parede.', 151),

('00000000-0000-0000-0000-000000000001', '20:00', 'Água', 'agua', 'Instalar 240 ml de água.', 160),

('00000000-0000-0000-0000-000000000001', '21:00', 'Mudança de decúbito', 'mudanca_decubito', 'Realizar conforme relógio da parede.', 170),

('00000000-0000-0000-0000-000000000001', '22:00', 'Medicação', 'medicacao', 'Domperidona 1 cp, diluído em 5 ml de água.', 180),

('00000000-0000-0000-0000-000000000001', '23:00', 'Medicação', 'medicacao', '4 comprimidos de aciclovir diluído em 10 ml de água.', 190),
('00000000-0000-0000-0000-000000000001', '23:00', 'Mudança de decúbito', 'mudanca_decubito', 'Realizar conforme relógio da parede.', 191);
