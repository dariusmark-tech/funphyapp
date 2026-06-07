
-- Add lesson_id to quizzes for per-lesson posttests
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS passing_score integer DEFAULT 70;
ALTER TABLE public.quizzes ALTER COLUMN module_id DROP NOT NULL;

-- Track posttest attempts on user_progress
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS posttest_score integer;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS posttest_passed boolean DEFAULT false;

-- Enable RLS read for quizzes/questions if not already
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes readable" ON public.quizzes;
CREATE POLICY "quizzes readable" ON public.quizzes FOR SELECT USING (true);
DROP POLICY IF EXISTS "questions readable" ON public.questions;
CREATE POLICY "questions readable" ON public.questions FOR SELECT USING (true);

-- Fix all video URLs with verified-working YouTube embeds
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/3yaZ7lkQPUQ' WHERE id = '0a53a047-eb75-46c3-a5e7-e9bd27a0e5f0';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/ZM8ECpBuQYE' WHERE id = '325272c5-5e2c-40a7-af8b-f7284fd8f164';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/ZM8ECpBuQYE' WHERE id = 'ae14572f-592d-4233-8fdc-d29a4e7479a2';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/ZM8ECpBuQYE' WHERE id = 'cbde8ad4-f858-4acd-8d0c-5193f54d1990';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/ZM8ECpBuQYE' WHERE id = 'af63217a-fbcf-4004-a2ef-3107581ec9ed';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/ZM8ECpBuQYE' WHERE id = '7dd3346b-d1fe-4d83-8815-4c628f3db3bd';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/kKKM8Y-u7ds' WHERE id = 'c00129ce-10c9-4798-a75c-3935a133bbb1';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/GnQrbW4HYtU' WHERE id = 'a36d1760-8e71-4e6a-981a-0d5c3a9837af';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/GnQrbW4HYtU' WHERE id = 'ed454680-0df9-445c-aa8d-bad80af91614';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/w4QFJb9a8vo' WHERE id = '815f9cfd-0b89-4e81-b327-e361562b35a2';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/w4QFJb9a8vo' WHERE id = '7f2782b6-4613-45a9-9d84-e7929b182e8c';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/w4QFJb9a8vo' WHERE id = '417799e5-c8b9-44d5-a5a0-087f540a23f1';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/aUrms3VFn0I' WHERE id = '7f2d1512-900b-462f-93a5-b848b5d277b3';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/GdDrYgXzBew' WHERE id = '3a9e1c71-49b0-4319-bc13-56759d8350d3';
UPDATE public.lessons SET video_url = 'https://www.youtube.com/embed/w4QFJb9a8vo' WHERE id = '69f6344d-7682-4be5-a362-6f767c7e1928';

-- Seed posttest quizzes (one per lesson) and 10 multiple-choice questions each
DELETE FROM public.questions WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE lesson_id IS NOT NULL);
DELETE FROM public.quizzes WHERE lesson_id IS NOT NULL;

DO $$
DECLARE
  l RECORD;
  qz_id uuid;
  qs jsonb;
  i int;
BEGIN
  FOR l IN SELECT id, title FROM public.lessons LOOP
    INSERT INTO public.quizzes (id, lesson_id, module_id, title, is_checkpoint, passing_score)
    SELECT gen_random_uuid(), l.id, lessons.module_id, 'Posttest: ' || l.title, false, 70
    FROM public.lessons WHERE lessons.id = l.id RETURNING id INTO qz_id;

    -- Build 10 generic but lesson-titled multiple-choice questions
    qs := CASE l.title
      WHEN 'Reference Frames' THEN '[
        {"q":"A reference frame is...","c":["A perspective from which motion is observed","A type of force","A unit of distance","A measuring instrument"],"a":"A perspective from which motion is observed"},
        {"q":"A frame is inertial when...","c":["It is at rest or moves at constant velocity","It accelerates","It rotates","It is moving fast"],"a":"It is at rest or moves at constant velocity"},
        {"q":"A passenger sitting in a moving bus is at rest relative to:","c":["The bus","The ground","The Sun","A pedestrian"],"a":"The bus"},
        {"q":"Motion is...","c":["Always relative","Absolute","Independent of frame","Imaginary"],"a":"Always relative"},
        {"q":"Earth''s surface is treated as approximately:","c":["Inertial","Non-inertial","Rotating only","Curved frame"],"a":"Inertial"},
        {"q":"Two observers in different inertial frames will agree on:","c":["The laws of physics","Velocity values","Position values","Direction of motion"],"a":"The laws of physics"},
        {"q":"In a non-inertial frame, you may need to add:","c":["Pseudo (fictitious) forces","Real friction","Gravity","Tension"],"a":"Pseudo (fictitious) forces"},
        {"q":"A car moving at 60 km/h relative to ground appears at rest in...","c":["The car''s own frame","The road''s frame","A pedestrian''s frame","A static frame"],"a":"The car''s own frame"},
        {"q":"Choosing a reference frame helps to:","c":["Define position and motion","Change physical laws","Slow time down","Stop motion"],"a":"Define position and motion"},
        {"q":"Which is NOT inertial?","c":["A spinning carousel","A train at constant velocity","A stationary lab","Free space"],"a":"A spinning carousel"}
      ]'::jsonb
      WHEN 'Distance vs Displacement' THEN '[
        {"q":"Distance is a:","c":["Scalar","Vector","Tensor","Force"],"a":"Scalar"},
        {"q":"Displacement is a:","c":["Vector","Scalar","Mass","Speed"],"a":"Vector"},
        {"q":"Walking 3 m east then 4 m west, distance =","c":["7 m","1 m","-1 m","12 m"],"a":"7 m"},
        {"q":"Walking 3 m east then 4 m west, displacement =","c":["1 m west","7 m east","0 m","4 m"],"a":"1 m west"},
        {"q":"Displacement depends on:","c":["Initial and final positions","Path taken","Speed","Time only"],"a":"Initial and final positions"},
        {"q":"If you return to start, displacement =","c":["Zero","Total path","Half path","Maximum"],"a":"Zero"},
        {"q":"Distance is always:","c":["Positive","Negative","Zero","Vector"],"a":"Positive"},
        {"q":"SI unit of both quantities:","c":["meter","second","kg","newton"],"a":"meter"},
        {"q":"Displacement can be:","c":["Negative","Only positive","Only zero","Imaginary"],"a":"Negative"},
        {"q":"In circular motion one full loop, displacement =","c":["0","2πr","πr","r"],"a":"0"}
      ]'::jsonb
      WHEN 'Speed and Velocity' THEN '[
        {"q":"Speed is:","c":["Scalar","Vector","Force","Mass"],"a":"Scalar"},
        {"q":"Velocity is:","c":["Vector","Scalar","Energy","Power"],"a":"Vector"},
        {"q":"Average speed = ","c":["Distance/Time","Displacement/Time","Time/Distance","Mass×Time"],"a":"Distance/Time"},
        {"q":"Average velocity = ","c":["Displacement/Time","Distance/Time","Speed×Mass","Force/Time"],"a":"Displacement/Time"},
        {"q":"SI unit:","c":["m/s","m","s","N"],"a":"m/s"},
        {"q":"Constant velocity means:","c":["Same speed and direction","Increasing speed","Decreasing speed","Changing direction"],"a":"Same speed and direction"},
        {"q":"A car at 60 km/h going north has:","c":["Speed and velocity defined","Only mass","No motion","Only force"],"a":"Speed and velocity defined"},
        {"q":"Instantaneous speed is:","c":["Speed at an instant","Average over time","Total path","Final speed"],"a":"Speed at an instant"},
        {"q":"Velocity changes if:","c":["Direction changes","Only mass changes","Only color changes","Only time passes"],"a":"Direction changes"},
        {"q":"Speedometer measures:","c":["Speed","Velocity","Acceleration","Force"],"a":"Speed"}
      ]'::jsonb
      WHEN 'What is Acceleration?' THEN '[
        {"q":"Acceleration is the rate of change of:","c":["Velocity","Distance","Mass","Force"],"a":"Velocity"},
        {"q":"SI unit of acceleration:","c":["m/s²","m/s","m","N"],"a":"m/s²"},
        {"q":"a = ","c":["Δv/Δt","Δx/Δt","Δm/Δt","F·t"],"a":"Δv/Δt"},
        {"q":"Negative acceleration means:","c":["Slowing down or reversing","No motion","Speeding up always","Constant velocity"],"a":"Slowing down or reversing"},
        {"q":"Acceleration is a:","c":["Vector","Scalar","Mass","Energy"],"a":"Vector"},
        {"q":"Constant velocity → acceleration =","c":["0","Maximum","Negative","Variable"],"a":"0"},
        {"q":"Free fall acceleration on Earth ≈","c":["9.8 m/s²","1 m/s²","100 m/s²","0"],"a":"9.8 m/s²"},
        {"q":"If v changes from 0 to 10 m/s in 5 s, a =","c":["2 m/s²","5 m/s²","10 m/s²","0.5 m/s²"],"a":"2 m/s²"},
        {"q":"Deceleration is:","c":["Negative acceleration","Positive acceleration","No acceleration","Constant velocity"],"a":"Negative acceleration"},
        {"q":"Acceleration occurs when:","c":["Velocity changes","Mass changes","Color changes","Time passes"],"a":"Velocity changes"}
      ]'::jsonb
      WHEN 'Kinematic Equations' THEN '[
        {"q":"v = u + at relates:","c":["Final velocity to initial, accel, time","Force to mass","Energy to power","Mass to weight"],"a":"Final velocity to initial, accel, time"},
        {"q":"s = ut + ½at² gives:","c":["Displacement","Force","Mass","Power"],"a":"Displacement"},
        {"q":"v² = u² + 2as solves for:","c":["Final velocity without time","Mass","Force","Energy"],"a":"Final velocity without time"},
        {"q":"Kinematic equations assume:","c":["Constant acceleration","Variable acceleration","Zero velocity","No motion"],"a":"Constant acceleration"},
        {"q":"u in equations means:","c":["Initial velocity","Final velocity","Acceleration","Time"],"a":"Initial velocity"},
        {"q":"For an object dropped from rest, u =","c":["0","9.8 m/s","10 m/s","1 m/s"],"a":"0"},
        {"q":"On Earth, free-fall a =","c":["9.8 m/s² down","9.8 m/s² up","0","1 m/s²"],"a":"9.8 m/s² down"},
        {"q":"To find time of flight, use:","c":["v = u + at","F = ma","E = mc²","P = W/t"],"a":"v = u + at"},
        {"q":"Average velocity (constant a) = ","c":["(u+v)/2","u·v","u−v","u·t"],"a":"(u+v)/2"},
        {"q":"Units of s:","c":["meter","second","kg","newton"],"a":"meter"}
      ]'::jsonb
      WHEN 'Free Fall' THEN '[
        {"q":"Free fall is motion under:","c":["Gravity only","Friction only","Air resistance","Magnetic force"],"a":"Gravity only"},
        {"q":"g on Earth ≈","c":["9.8 m/s²","9.8 m","9.8 N","9.8 s"],"a":"9.8 m/s²"},
        {"q":"Direction of g:","c":["Downward","Upward","Horizontal","Random"],"a":"Downward"},
        {"q":"Object dropped from rest, after 1 s, v =","c":["9.8 m/s","0","1 m/s","19.6 m/s"],"a":"9.8 m/s"},
        {"q":"Distance fallen in t seconds (from rest):","c":["½gt²","gt","g/t","gt³"],"a":"½gt²"},
        {"q":"In vacuum, all objects fall at:","c":["Same rate","Different rates by mass","Faster if heavier","Slower if heavier"],"a":"Same rate"},
        {"q":"Air resistance causes:","c":["Slower fall","Faster fall","No effect","Reverse motion"],"a":"Slower fall"},
        {"q":"Object thrown up reaches max height when v =","c":["0","g","u","2u"],"a":"0"},
        {"q":"Time up = time down because:","c":["a is constant","No gravity","Mass differs","Air helps"],"a":"a is constant"},
        {"q":"On the Moon, g is:","c":["Smaller than Earth","Larger","Zero","Negative"],"a":"Smaller than Earth"}
      ]'::jsonb
      WHEN 'Inertia & Newton''s First Law' THEN '[
        {"q":"Newton''s 1st Law is also called:","c":["Law of inertia","Law of action","Law of reaction","Law of force"],"a":"Law of inertia"},
        {"q":"An object at rest tends to:","c":["Stay at rest","Start moving","Accelerate","Vibrate"],"a":"Stay at rest"},
        {"q":"Inertia depends on:","c":["Mass","Color","Shape","Volume only"],"a":"Mass"},
        {"q":"More mass means:","c":["More inertia","Less inertia","No inertia","Zero weight"],"a":"More inertia"},
        {"q":"A moving object continues until:","c":["A net force acts","Time runs out","Mass changes","It changes color"],"a":"A net force acts"},
        {"q":"Seat belts use the concept of:","c":["Inertia","Energy","Power","Friction only"],"a":"Inertia"},
        {"q":"Net force = 0 means:","c":["Constant velocity","Acceleration","Stop instantly","Speed up"],"a":"Constant velocity"},
        {"q":"In space, a pushed ball will:","c":["Keep moving forever","Stop","Reverse","Vanish"],"a":"Keep moving forever"},
        {"q":"Inertia is the tendency to resist:","c":["Change in motion","Change in color","Mass","Time"],"a":"Change in motion"},
        {"q":"Unit of mass (SI):","c":["kg","N","m","s"],"a":"kg"}
      ]'::jsonb
      WHEN 'Momentum' THEN '[
        {"q":"Momentum p = ","c":["mv","ma","mg","mc²"],"a":"mv"},
        {"q":"SI unit of momentum:","c":["kg·m/s","N","J","W"],"a":"kg·m/s"},
        {"q":"Momentum is a:","c":["Vector","Scalar","Energy","Power"],"a":"Vector"},
        {"q":"Doubling velocity → momentum:","c":["Doubles","Halves","Stays","Quadruples"],"a":"Doubles"},
        {"q":"Doubling mass → momentum:","c":["Doubles","Halves","Stays","Triples"],"a":"Doubles"},
        {"q":"Impulse = change in:","c":["Momentum","Mass","Energy","Power"],"a":"Momentum"},
        {"q":"Impulse = ","c":["F·Δt","m·g","½mv²","F/m"],"a":"F·Δt"},
        {"q":"Heavier truck vs car at same speed → more:","c":["Momentum","Inertia only","Color","Time"],"a":"Momentum"},
        {"q":"Stopping fast object needs:","c":["Larger impulse","No force","Less mass","Less time"],"a":"Larger impulse"},
        {"q":"Momentum direction matches:","c":["Velocity","Acceleration","Force","Mass"],"a":"Velocity"}
      ]'::jsonb
      WHEN 'Conservation of Momentum' THEN '[
        {"q":"Total momentum is conserved when:","c":["No external force","Always","Force is large","Mass is small"],"a":"No external force"},
        {"q":"Σp before = Σp after in:","c":["Closed system","Open system","Vacuum only","No system"],"a":"Closed system"},
        {"q":"Two carts collide and stick — this is:","c":["Inelastic","Elastic","Explosive","Static"],"a":"Inelastic"},
        {"q":"In elastic collision:","c":["KE conserved","KE lost","Mass lost","Momentum lost"],"a":"KE conserved"},
        {"q":"Recoil of a gun illustrates:","c":["Momentum conservation","Friction","Gravity","Air drag"],"a":"Momentum conservation"},
        {"q":"Newton''s 3rd Law and momentum are:","c":["Related","Opposite","Independent","Same"],"a":"Related"},
        {"q":"In rocket propulsion, exhaust gives rocket:","c":["Forward momentum","No effect","Backward only","Heat only"],"a":"Forward momentum"},
        {"q":"If 2 kg @ 3 m/s hits 1 kg at rest and they stick: v =","c":["2 m/s","3 m/s","1 m/s","6 m/s"],"a":"2 m/s"},
        {"q":"External force breaks:","c":["Conservation","Mass","Energy only","Time"],"a":"Conservation"},
        {"q":"Total momentum is a:","c":["Vector sum","Scalar sum","Mass sum","Speed sum"],"a":"Vector sum"}
      ]'::jsonb
      WHEN 'Work and Energy' THEN '[
        {"q":"Work W = ","c":["F·d·cosθ","m·g","½mv²","F/m"],"a":"F·d·cosθ"},
        {"q":"SI unit of work:","c":["Joule","Newton","Watt","Pascal"],"a":"Joule"},
        {"q":"Energy is the capacity to:","c":["Do work","Move mass only","Apply force","Make heat only"],"a":"Do work"},
        {"q":"Work is zero when:","c":["F ⟂ d","F ∥ d","d = ∞","F = ∞"],"a":"F ⟂ d"},
        {"q":"Lifting a book does:","c":["Positive work","Negative work","Zero work","Infinite work"],"a":"Positive work"},
        {"q":"1 J = ","c":["1 N·m","1 kg·m","1 W·s²","1 Pa·m"],"a":"1 N·m"},
        {"q":"Energy is a:","c":["Scalar","Vector","Mass","Force"],"a":"Scalar"},
        {"q":"Friction does:","c":["Negative work","Positive work","No work","Infinite work"],"a":"Negative work"},
        {"q":"Carrying a box horizontally at constant v: gravity does:","c":["Zero work","Positive work","Negative","Variable"],"a":"Zero work"},
        {"q":"Work-energy theorem: W_net =","c":["ΔKE","Δm","Δt","Δp"],"a":"ΔKE"}
      ]'::jsonb
      WHEN 'Kinetic Energy' THEN '[
        {"q":"KE = ","c":["½mv²","mgh","mv","Fd"],"a":"½mv²"},
        {"q":"SI unit:","c":["Joule","Newton","Watt","kg"],"a":"Joule"},
        {"q":"Doubling v → KE:","c":["Quadruples","Doubles","Halves","Same"],"a":"Quadruples"},
        {"q":"Doubling m → KE:","c":["Doubles","Halves","Quadruples","Stays"],"a":"Doubles"},
        {"q":"KE is a:","c":["Scalar","Vector","Mass","Force"],"a":"Scalar"},
        {"q":"At rest, KE =","c":["0","Maximum","Negative","Infinite"],"a":"0"},
        {"q":"KE depends on:","c":["Mass and speed","Color","Position only","Charge only"],"a":"Mass and speed"},
        {"q":"A 2 kg ball at 3 m/s has KE =","c":["9 J","6 J","18 J","3 J"],"a":"9 J"},
        {"q":"KE can be:","c":["Only positive or zero","Negative","Imaginary","Vector"],"a":"Only positive or zero"},
        {"q":"KE → heat through:","c":["Friction","Gravity only","Magnetism only","Light"],"a":"Friction"}
      ]'::jsonb
      WHEN 'Work-Energy Theorem' THEN '[
        {"q":"Theorem states: W_net =","c":["ΔKE","Δm","Δp","ΔU"],"a":"ΔKE"},
        {"q":"If W_net > 0, KE:","c":["Increases","Decreases","Stays","Becomes 0"],"a":"Increases"},
        {"q":"If W_net < 0, KE:","c":["Decreases","Increases","Doubles","Quadruples"],"a":"Decreases"},
        {"q":"Theorem applies to:","c":["Any net force","Only gravity","Only friction","Only springs"],"a":"Any net force"},
        {"q":"It connects work to:","c":["Motion energy","Color","Mass change","Time"],"a":"Motion energy"},
        {"q":"For object at constant v, W_net =","c":["0","Max","Negative","Infinite"],"a":"0"},
        {"q":"Stopping a car requires negative:","c":["Work","Mass","Force only","Energy creation"],"a":"Work"},
        {"q":"Brake force does:","c":["Negative work","Positive work","No work","Infinite"],"a":"Negative work"},
        {"q":"W_net depends on:","c":["Net force × displacement","Mass only","Time only","Color"],"a":"Net force × displacement"},
        {"q":"Unit of W and KE:","c":["Joule","Newton","kg","Pa"],"a":"Joule"}
      ]'::jsonb
      WHEN 'Potential Energy' THEN '[
        {"q":"Gravitational PE = ","c":["mgh","½mv²","mv","Fd"],"a":"mgh"},
        {"q":"PE depends on:","c":["Position","Speed","Color","Charge"],"a":"Position"},
        {"q":"Unit:","c":["Joule","Newton","Watt","kg"],"a":"Joule"},
        {"q":"Higher altitude → PE:","c":["Increases","Decreases","Same","Zero"],"a":"Increases"},
        {"q":"Spring PE = ","c":["½kx²","mgh","½mv²","kx"],"a":"½kx²"},
        {"q":"PE is a:","c":["Scalar","Vector","Mass","Force"],"a":"Scalar"},
        {"q":"Reference level for PE:","c":["Arbitrary","Always sea level","Center of Earth","Top of object"],"a":"Arbitrary"},
        {"q":"5 kg at 2 m, g=10: PE =","c":["100 J","10 J","50 J","20 J"],"a":"100 J"},
        {"q":"PE → KE when object:","c":["Falls","Stops","Heats","Cools"],"a":"Falls"},
        {"q":"Conservative force example:","c":["Gravity","Friction","Air drag","Tension only"],"a":"Gravity"}
      ]'::jsonb
      WHEN 'Conservation of Energy' THEN '[
        {"q":"Energy can be:","c":["Transformed","Created","Destroyed","Multiplied"],"a":"Transformed"},
        {"q":"Total energy in closed system is:","c":["Constant","Lost","Doubled","Zero"],"a":"Constant"},
        {"q":"PE + KE = ","c":["Constant (no friction)","Always 0","Doubles","Halves"],"a":"Constant (no friction)"},
        {"q":"Falling object: PE → ","c":["KE","Mass","Charge","Color"],"a":"KE"},
        {"q":"Pendulum at top has max:","c":["PE","KE","Speed","Momentum"],"a":"PE"},
        {"q":"Pendulum at bottom has max:","c":["KE","PE","Mass","Height"],"a":"KE"},
        {"q":"Energy lost to friction → ","c":["Heat","Mass","Charge","Light only"],"a":"Heat"},
        {"q":"Conservation requires:","c":["No non-conservative forces","Friction only","No mass","Vacuum only"],"a":"No non-conservative forces"},
        {"q":"Unit of energy:","c":["Joule","kg","Pa","N"],"a":"Joule"},
        {"q":"Roller coaster relies on:","c":["Energy conservation","Mass loss","No gravity","Random force"],"a":"Energy conservation"}
      ]'::jsonb
      WHEN 'Power and Efficiency' THEN '[
        {"q":"Power P = ","c":["W/t","F·d","½mv²","mgh"],"a":"W/t"},
        {"q":"SI unit of power:","c":["Watt","Joule","Newton","kg"],"a":"Watt"},
        {"q":"1 W = ","c":["1 J/s","1 N·m","1 kg·m","1 Pa·m"],"a":"1 J/s"},
        {"q":"Efficiency = ","c":["Useful out / Total in","In/Out","Out·In","Out−In"],"a":"Useful out / Total in"},
        {"q":"Efficiency is usually expressed as:","c":["Percentage","Joules","Newtons","Meters"],"a":"Percentage"},
        {"q":"Real machines have efficiency:","c":["Less than 100%","Always 100%","Over 100%","Exactly 0"],"a":"Less than 100%"},
        {"q":"Power also = ","c":["F·v","F+v","F−v","F/v"],"a":"F·v"},
        {"q":"Doing 100 J in 5 s: P =","c":["20 W","500 W","5 W","100 W"],"a":"20 W"},
        {"q":"Lost energy often becomes:","c":["Heat","Mass","Charge","Light only"],"a":"Heat"},
        {"q":"Higher power → work done:","c":["Faster","Slower","Same speed","Never"],"a":"Faster"}
      ]'::jsonb
      ELSE '[]'::jsonb
    END;

    FOR i IN 0..(jsonb_array_length(qs) - 1) LOOP
      INSERT INTO public.questions (quiz_id, question_text, answer_type, choices, correct_answer, order_index)
      VALUES (
        qz_id,
        qs->i->>'q',
        'multiple_choice',
        qs->i->'c',
        qs->i->>'a',
        i + 1
      );
    END LOOP;
  END LOOP;
END $$;
