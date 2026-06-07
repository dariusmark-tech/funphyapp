
-- ===== UNIT 1: Realm of Varyon =====
UPDATE public.lessons SET text_content = $$A reference frame is a coordinate system or viewpoint used to describe the position and motion of objects. Motion can appear different depending on the observer's frame of reference.

For example, a passenger sitting inside a moving train appears stationary relative to another passenger but appears moving relative to a person standing outside the train. Relative motion occurs when the motion of an object is measured with respect to another moving object.

Physicists use frame changes to analyze motion from different perspectives. Understanding reference frames is essential in mechanics because many physical observations depend on the observer's motion. Relative velocity is commonly used in aviation, marine navigation, and traffic analysis.$$
WHERE id = '0a53a047-eb75-46c3-a5e7-e9bd27a0e5f0';

UPDATE public.lessons SET text_content = $$Position describes the location of an object relative to a chosen reference point. In physics, position is usually represented using coordinates such as meters along the x-axis.

Displacement refers to the change in position of an object and is represented as a vector quantity because it has both magnitude and direction. Unlike distance, displacement only considers the shortest path between the initial and final positions.

Example: A student walks 5 meters east from the classroom door. The displacement is 5 meters east.$$
WHERE id = '325272c5-5e2c-40a7-af8b-f7284fd8f164';

UPDATE public.lessons SET text_content = $$Velocity describes how fast an object changes position with respect to time and also includes direction. Average velocity is calculated by dividing displacement by the time interval.

Velocity is important in understanding motion because it explains both speed and direction of movement. In real-life situations, velocity is applied in transportation, sports, engineering, and navigation systems.

Example: A car travels 100 meters in 5 seconds. v = d / t = 100 m / 5 s = 20 m/s.$$
WHERE id = 'ae14572f-592d-4233-8fdc-d29a4e7479a2';

-- ===== UNIT 2: Realm of Accelara =====
UPDATE public.lessons SET text_content = $$Acceleration is the rate at which velocity changes over time. The formula is a = Δv / Δt. The SI unit is meters per second squared (m/s²).

Example: A bicycle increases its velocity from 4 m/s to 16 m/s in 6 seconds. Acceleration = (16 - 4) / 6 = 2 m/s².$$
WHERE id = 'cbde8ad4-f858-4acd-8d0c-5193f54d1990';

UPDATE public.lessons SET text_content = $$The Law of Inertia, also known as Newton's First Law of Motion, states that an object will remain at rest or continue moving at a constant velocity unless acted upon by an external force.

This is the foundation for the kinematic equations that describe motion under constant acceleration: v = u + at, s = ut + ½at², and v² = u² + 2as.

Example: A motorcycle changes velocity from 12 m/s to 24 m/s in 3 seconds. Acceleration = (24 - 12) / 3 = 4 m/s².$$
WHERE id = 'af63217a-fbcf-4004-a2ef-3107581ec9ed';

UPDATE public.lessons SET text_content = $$Free fall is the motion of an object when gravity is the only force acting on it. Freely falling objects accelerate downward at approximately 9.8 m/s².

Example 1: A stone is dropped from rest and falls for 3 seconds. Final velocity = -29.4 m/s downward.

Example 2: A ball thrown upward with an initial velocity of 20 m/s reaches a maximum height of approximately 20.41 m. At the highest point its velocity is zero.$$
WHERE id = '7dd3346b-d1fe-4d83-8815-4c628f3db3bd';

-- ===== UNIT 3: Realm of Inertros =====
UPDATE public.lessons SET text_content = $$Inertia is the natural tendency of an object to resist any change in its state of motion. Objects at rest remain at rest, while objects in motion continue moving at constant velocity unless acted upon by an external force. This idea is explained by Newton's First Law of Motion, also called the Law of Inertia.

Mass is the measure of inertia, meaning heavier objects are harder to move, stop, or change direction compared to lighter objects.

Everyday examples include passengers moving forward when a vehicle suddenly stops or feeling pushed backward when a bus accelerates. Inertia plays an important role in transportation, engineering, and safety systems such as seatbelts and airbags.$$
WHERE id = 'c00129ce-10c9-4798-a75c-3935a133bbb1';

UPDATE public.lessons SET text_content = $$Momentum describes the quantity of motion possessed by an object and depends on both mass and velocity. The formula is p = m × v, where p is momentum, m is mass, and v is velocity.

Momentum is a vector quantity because it has both magnitude and direction. A large truck moving quickly has greater momentum than a small ball rolling slowly.

Example: A 4 kg bowling ball moving at 5 m/s has momentum p = (4)(5) = 20 kg·m/s.$$
WHERE id = 'a36d1760-8e71-4e6a-981a-0d5c3a9837af';

UPDATE public.lessons SET text_content = $$The law of conservation of momentum states that in an isolated system, total momentum remains constant before and after collisions. This principle is applied in rocket propulsion, sports, transportation, and collision analysis.

An extended system is composed of multiple particles or objects interacting with each other. Instead of analyzing every individual particle, physicists often use the concept of center of mass — the point where the entire mass of a system can be considered concentrated.

Example: Two masses m₁ = 2 kg at x₁ = 1 m and m₂ = 6 kg at x₂ = 5 m. Center of mass: x_cm = (m₁x₁ + m₂x₂) / (m₁ + m₂) = (2 + 30) / 8 = 4 m.$$
WHERE id = 'ed454680-0df9-445c-aa8d-bad80af91614';

-- ===== Replace assessments with official unit posttests =====

-- Unit 1 quizzes (Reference Frames, Distance vs Displacement, Speed & Velocity)
DELETE FROM public.questions WHERE quiz_id IN (
  '207e95f2-a67e-4289-9530-c26eb1ac792a',
  'e46a83a7-0a04-4a43-99b3-1d3352b5bcd0',
  '909f4da2-bdbe-4329-a2ef-75ee2db045ea'
);

INSERT INTO public.questions (quiz_id, question_text, choices, correct_answer, order_index)
SELECT q.id, x.question_text, x.choices::jsonb, x.correct_answer, x.order_index
FROM (VALUES
  (1, 'What describes the location of an object?', '["Velocity","Position","Acceleration","Force"]', 'Position'),
  (2, 'Displacement is:', '["Total path traveled","Change in position","Speed only","Time interval"]', 'Change in position'),
  (3, 'Velocity includes:', '["Magnitude only","Direction only","Speed and direction","Mass"]', 'Speed and direction'),
  (4, 'Reference frame means:', '["Measuring tool","Viewpoint for observing motion","Speed of an object","Position of gravity"]', 'Viewpoint for observing motion'),
  (5, 'Relative motion depends on:', '["Observer","Mass only","Temperature","Shape of object"]', 'Observer'),
  (6, 'Which is the formula for velocity?', '["v = d / t","F = m a","p = m v","KE = ½ m v²"]', 'v = d / t'),
  (7, 'Which is a vector quantity?', '["Distance","Velocity","Time","Mass"]', 'Velocity'),
  (8, 'A passenger inside a moving train appears stationary relative to:', '["Trees outside","Another passenger","The road","Buildings"]', 'Another passenger'),
  (9, 'SI unit of velocity:', '["Meter","m/s","Newton","Joule"]', 'm/s'),
  (10, 'Displacement considers:', '["Entire path traveled","Shortest path between positions","Speed of motion","Time interval"]', 'Shortest path between positions')
) AS x(order_index, question_text, choices, correct_answer)
CROSS JOIN (VALUES
  ('207e95f2-a67e-4289-9530-c26eb1ac792a'::uuid),
  ('e46a83a7-0a04-4a43-99b3-1d3352b5bcd0'::uuid),
  ('909f4da2-bdbe-4329-a2ef-75ee2db045ea'::uuid)
) AS q(id);

-- Unit 2 quizzes
DELETE FROM public.questions WHERE quiz_id IN (
  'aeef1a8b-36ea-478a-b756-2311d479baf6',
  '5c34367f-5bf4-4645-abff-11836408bf8a',
  '1defab3d-ca58-4355-8bac-06ce2bff4e92'
);

INSERT INTO public.questions (quiz_id, question_text, choices, correct_answer, order_index)
SELECT q.id, x.question_text, x.choices::jsonb, x.correct_answer, x.order_index
FROM (VALUES
  (1, 'Which of the following best describes inertia?', '["The force that causes motion","The resistance of an object to changes in motion","The speed of an object","The acceleration of an object"]', 'The resistance of an object to changes in motion'),
  (2, 'What is the SI unit of acceleration?', '["m/s","kg","m/s²","N"]', 'm/s²'),
  (3, 'A car increases its velocity from 5 m/s to 25 m/s in 4 seconds. What is its acceleration?', '["4 m/s²","5 m/s²","6 m/s²","8 m/s²"]', '5 m/s²'),
  (4, 'Which scientist studied free fall?', '["Isaac Newton","Albert Einstein","Galileo Galilei","Nikola Tesla"]', 'Galileo Galilei'),
  (5, 'What is the acceleration due to gravity near Earth''s surface?', '["4.9 m/s²","8.9 m/s²","9.8 m/s²","10.8 m/s²"]', '9.8 m/s²'),
  (6, 'A ball dropped from rest falls for 2 seconds. What is its final velocity?', '["9.8 m/s downward","19.6 m/s downward","29.4 m/s downward","39.2 m/s downward"]', '19.6 m/s downward'),
  (7, 'What happens when the net force acting on an object is zero?', '["It accelerates continuously","It changes direction immediately","It remains at rest or moves with constant velocity","It stops automatically"]', 'It remains at rest or moves with constant velocity'),
  (8, 'A motorcycle changes velocity from 12 m/s to 24 m/s in 3 seconds. Find the acceleration.', '["2 m/s²","3 m/s²","4 m/s²","5 m/s²"]', '4 m/s²'),
  (9, 'Which is an example of free fall?', '["A car moving on a road","A parachute descending slowly","A book sliding across a table","A stone dropped from a cliff"]', 'A stone dropped from a cliff'),
  (10, 'At the highest point of a ball thrown upward, what is its velocity?', '["Maximum velocity","9.8 m/s","Zero","Infinite"]', 'Zero')
) AS x(order_index, question_text, choices, correct_answer)
CROSS JOIN (VALUES
  ('aeef1a8b-36ea-478a-b756-2311d479baf6'::uuid),
  ('5c34367f-5bf4-4645-abff-11836408bf8a'::uuid),
  ('1defab3d-ca58-4355-8bac-06ce2bff4e92'::uuid)
) AS q(id);

-- Unit 3 quizzes
DELETE FROM public.questions WHERE quiz_id IN (
  '8c8759bb-c8af-437f-9cb9-f02483a4359c',
  '22f90a09-d709-406d-b224-8c0e00671bb4',
  'dd370f79-67cb-4684-8bd1-cdd850449172'
);

INSERT INTO public.questions (quiz_id, question_text, choices, correct_answer, order_index)
SELECT q.id, x.question_text, x.choices::jsonb, x.correct_answer, x.order_index
FROM (VALUES
  (1, 'Which of the following best describes inertia?', '["The ability to speed up motion","The resistance of an object to changes in motion","The force that pulls objects downward","The energy stored in an object"]', 'The resistance of an object to changes in motion'),
  (2, 'What is the momentum of a 5 kg object moving at 4 m/s? (p = m v)', '["9 kg·m/s","20 kg·m/s","25 kg·m/s","40 kg·m/s"]', '20 kg·m/s'),
  (3, 'Which quantity is directly related to inertia?', '["Velocity","Acceleration","Mass","Force"]', 'Mass'),
  (4, 'The law of conservation of momentum states that:', '["Energy can never be destroyed","Total momentum remains constant in an isolated system","Objects always move in straight lines","Force is always equal to mass"]', 'Total momentum remains constant in an isolated system'),
  (5, 'Which object has the greatest momentum?', '["A bicycle moving slowly","A stationary truck","A fast-moving train","A rolling tennis ball"]', 'A fast-moving train'),
  (6, 'The center of mass of an object is:', '["The exact middle of every object","The point where all mass is considered concentrated","The heaviest part of an object","The point where gravity disappears"]', 'The point where all mass is considered concentrated'),
  (7, 'A passenger moves forward when a car suddenly stops because of:', '["Gravity","Friction","Inertia","Magnetism"]', 'Inertia'),
  (8, 'Which formula represents the impulse–momentum relationship?', '["F = m a","p = m v","F Δt = Δp","KE = ½ m v²"]', 'F Δt = Δp'),
  (9, 'If no external force acts on a system, the total momentum will:', '["Increase continuously","Decrease to zero","Remain constant","Reverse direction"]', 'Remain constant'),
  (10, 'Why do seatbelts reduce injuries during accidents?', '["They increase velocity","They increase momentum","They reduce the time of impact","They increase the time over which momentum changes"]', 'They increase the time over which momentum changes')
) AS x(order_index, question_text, choices, correct_answer)
CROSS JOIN (VALUES
  ('8c8759bb-c8af-437f-9cb9-f02483a4359c'::uuid),
  ('22f90a09-d709-406d-b224-8c0e00671bb4'::uuid),
  ('dd370f79-67cb-4684-8bd1-cdd850449172'::uuid)
) AS q(id);
