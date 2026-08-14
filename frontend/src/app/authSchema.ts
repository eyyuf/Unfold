import { z } from 'zod'
export const authSchema = (mode: 'login' | 'register') => z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().optional(),
  accept_terms: z.boolean().optional(),
}).superRefine((data, context) => {
  if (mode === 'register' && data.password !== data.confirm_password) {
    context.addIssue({ code: 'custom', path: ['confirm_password'], message: 'Passwords do not match' })
  }
  if (mode === 'register' && !data.accept_terms) {
    context.addIssue({ code: 'custom', path: ['accept_terms'], message: 'You must accept the Terms and Privacy Policy' })
  }
})
