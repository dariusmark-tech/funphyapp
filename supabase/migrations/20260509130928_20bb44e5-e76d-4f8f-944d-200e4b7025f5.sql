
DELETE FROM public.lessons;

INSERT INTO public.lessons (module_id, order_index, title, text_content) VALUES
-- Realm of Varyon (1) - Reference Frame, Displacement, Velocity
('607a59c4-8bfd-4377-aeec-3a1a7203a5a2', 1, 'Reference Frames',
'A reference frame is the perspective from which motion is observed and measured.

KEY IDEA
Motion is always relative. A passenger sitting in a moving bus is at rest relative to the bus, but moving relative to the ground.

INERTIAL FRAMES
A frame is "inertial" if Newton''s laws hold within it — no acceleration of the frame itself. Earth''s surface is treated as approximately inertial for everyday motion.

EXAMPLE
You walk at 1 m/s inside a train moving at 20 m/s.
• Relative to train: 1 m/s
• Relative to ground: 21 m/s

TAKEAWAY
Always specify the reference frame before describing motion.'),

('607a59c4-8bfd-4377-aeec-3a1a7203a5a2', 2, 'Distance vs Displacement',
'Distance is the total path length traveled (scalar).
Displacement is the straight-line change in position from start to end (vector).

FORMULA
Δx = x_final − x_initial

EXAMPLE
You walk 3 m east, then 4 m west.
• Distance traveled = 7 m
• Displacement = −1 m (1 m west)

REMEMBER
• Distance is always positive.
• Displacement has direction (+/−).
• If you return to start, displacement = 0 even if distance > 0.'),

('607a59c4-8bfd-4377-aeec-3a1a7203a5a2', 3, 'Speed and Velocity',
'Speed is how fast you move (scalar). Velocity is speed with direction (vector).

FORMULAS
Average speed = distance / time
Average velocity = displacement / time
v = Δx / Δt

EXAMPLE
A car travels 100 km north in 2 hours.
• Speed = 50 km/h
• Velocity = 50 km/h north

INSTANTANEOUS VELOCITY
The velocity at a specific moment in time — the slope of a position-time graph at that point.'),

-- Realm of Accelara (2) - Acceleration
('9f560bd0-2346-473d-8b33-d632d07243ba', 1, 'What is Acceleration?',
'Acceleration is the rate of change of velocity over time.

FORMULA
a = Δv / Δt = (v_final − v_initial) / t

UNITS: m/s²

EXAMPLE
A car speeds up from 0 to 20 m/s in 5 seconds.
a = (20 − 0) / 5 = 4 m/s²

DECELERATION
Negative acceleration — slowing down. If a car going 20 m/s stops in 4 s:
a = (0 − 20) / 4 = −5 m/s²'),

('9f560bd0-2346-473d-8b33-d632d07243ba', 2, 'Kinematic Equations',
'For constant acceleration, use these four equations:

1) v = v₀ + at
2) x = v₀t + ½at²
3) v² = v₀² + 2aΔx
4) x = ½(v₀ + v)t

WHERE
• v₀ = initial velocity
• v = final velocity
• a = acceleration
• t = time
• x = displacement

EXAMPLE
A ball dropped from rest (v₀ = 0), a = 9.8 m/s². How fast after 3 s?
v = 0 + (9.8)(3) = 29.4 m/s'),

('9f560bd0-2346-473d-8b33-d632d07243ba', 3, 'Free Fall',
'Free fall is motion under gravity alone (no air resistance).

g = 9.8 m/s² (downward, near Earth''s surface)

KEY POINTS
• All objects fall at the same rate in vacuum.
• Going up: gravity decelerates the object.
• At the peak: v = 0, but a = −9.8 m/s² still.
• Coming down: gravity accelerates it.

EXAMPLE
Throw a ball up at 19.6 m/s. Time to peak?
0 = 19.6 − 9.8t → t = 2 s'),

-- Realm of Inertros (3) - Momentum and Inertia
('267f4e0a-cb54-4f3b-a639-47712e0d53b5', 1, 'Inertia & Newton''s First Law',
'Inertia is the tendency of an object to resist changes in its motion.

NEWTON''S FIRST LAW
An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted on by a net external force.

MASS = measure of inertia
More mass = more inertia = harder to start, stop, or turn.

EXAMPLES
• A book on a table stays put until pushed.
• Passengers lurch forward when a car brakes — their bodies want to keep moving.'),

('267f4e0a-cb54-4f3b-a639-47712e0d53b5', 2, 'Momentum',
'Momentum is mass in motion.

FORMULA
p = mv

UNITS: kg·m/s
Momentum is a VECTOR — it has direction.

EXAMPLE
A 1000 kg car moving at 20 m/s east:
p = 1000 × 20 = 20,000 kg·m/s east

A small bullet can have huge momentum because of its high velocity.'),

('267f4e0a-cb54-4f3b-a639-47712e0d53b5', 3, 'Conservation of Momentum',
'In a closed system (no external forces), total momentum before = total momentum after.

p₁ᵢ + p₂ᵢ = p₁f + p₂f

EXAMPLE — Collision
A 2 kg ball at 3 m/s hits a stationary 1 kg ball. After collision the 2 kg ball moves at 1 m/s.
Initial: (2)(3) + (1)(0) = 6
Final: (2)(1) + (1)(v) = 6 → v = 4 m/s

Conservation of momentum is one of the most powerful laws in physics — it works for collisions, explosions, and rocket propulsion.'),

-- Realm of Kinetra (4) - Kinetic Energy
('81500d30-8896-42e1-b425-7a8a26071bc7', 1, 'Work and Energy',
'Work is done when a force moves an object through a distance.

FORMULA
W = F · d · cos(θ)

UNITS: Joule (J) = N·m

ENERGY is the capacity to do work. Same units as work (Joules).

EXAMPLE
Push a box with 50 N over 3 m (in same direction):
W = 50 × 3 = 150 J'),

('81500d30-8896-42e1-b425-7a8a26071bc7', 2, 'Kinetic Energy',
'Kinetic energy is the energy of motion.

FORMULA
KE = ½mv²

UNITS: Joules

KEY INSIGHT
KE depends on velocity SQUARED. Doubling speed quadruples kinetic energy.

EXAMPLE
A 1500 kg car at 20 m/s:
KE = ½ × 1500 × 20² = 300,000 J = 300 kJ

At 40 m/s the same car has 1.2 MJ — four times more!'),

('81500d30-8896-42e1-b425-7a8a26071bc7', 3, 'Work-Energy Theorem',
'The net work done on an object equals its change in kinetic energy.

W_net = ΔKE = ½mv² − ½mv₀²

EXAMPLE
A 2 kg object accelerates from 3 m/s to 7 m/s. Work done?
W = ½(2)(7²) − ½(2)(3²) = 49 − 9 = 40 J

This theorem links forces (which do work) directly to motion (kinetic energy) — a bridge between dynamics and energy.'),

-- Realm of Enereth (5) - Interaction & Energy
('dbf4fd58-1359-4ef9-83dd-499fc0fc2175', 1, 'Potential Energy',
'Potential energy is stored energy due to position or configuration.

GRAVITATIONAL PE
PE = mgh
where h is height above reference level.

EXAMPLE
A 5 kg book on a 2 m shelf:
PE = 5 × 9.8 × 2 = 98 J

ELASTIC PE (spring)
PE = ½kx²
where k = spring constant, x = displacement from equilibrium.'),

('dbf4fd58-1359-4ef9-83dd-499fc0fc2175', 2, 'Conservation of Energy',
'Energy cannot be created or destroyed — only transformed.

KE + PE = constant (in absence of friction)

EXAMPLE — Roller coaster
At the top: PE = max, KE = 0
At the bottom: PE = 0, KE = max
Total energy stays the same.

mgh = ½mv²  →  v = √(2gh)

A coaster dropping 20 m reaches:
v = √(2 × 9.8 × 20) ≈ 19.8 m/s'),

('dbf4fd58-1359-4ef9-83dd-499fc0fc2175', 3, 'Power and Efficiency',
'POWER is the rate at which work is done.

P = W / t = F · v

UNITS: Watt (W) = J/s
1 horsepower ≈ 746 W

EXAMPLE
Lift 200 J of work in 4 s: P = 50 W

EFFICIENCY
η = (useful energy out / total energy in) × 100%

No real machine is 100% efficient — some energy always becomes heat or sound (friction, resistance). This is the foundation of thermodynamics.');
