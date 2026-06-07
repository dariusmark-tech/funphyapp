
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

INSERT INTO public.modules (title, description, order_index, icon, color) VALUES
('Kinematics','Motion in one and two dimensions: position, velocity, acceleration.',1,'rocket','#39FF14'),
('Dynamics','Forces, Newton''s laws, free-body diagrams, friction.',2,'zap','#00E5FF'),
('Energy','Work, kinetic & potential energy, conservation.',3,'battery','#FFD60A'),
('Momentum','Linear momentum, impulse, collisions.',4,'target','#FF3B7A'),
('Rotational Motion','Angular kinematics, torque, moment of inertia.',5,'rotate-cw','#B388FF');

INSERT INTO public.lessons (module_id, title, text_content, order_index)
SELECT id, 'Intro to ' || title, 'Welcome to ' || title || '. Master the core ideas, then test yourself.', 1 FROM public.modules;

INSERT INTO public.daily_quests (description, target_xp, reward_gems) VALUES
('Earn 30 XP today', 30, 10);
