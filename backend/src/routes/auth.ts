import { Hono } from "hono";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const router = new Hono();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Invalid JSON" }, 400);

  const result = loginSchema.safeParse(body);
  if (!result.success) return c.json({ error: result.error.flatten() }, 400);

  const { email, password } = result.data;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  return c.json({
    data: {
      token: data.session.access_token,
      user: { id: data.user.id, email: data.user.email },
    },
  });
});

export { router as authRouter };
