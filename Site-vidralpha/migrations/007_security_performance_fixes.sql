-- Melhorias de Segurança: Corrigindo o search_path das funções
ALTER FUNCTION public.update_updated_at_column() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER SET search_path = public;

-- Corrigindo as políticas da tabela `profiles` (Init Plan & Duplicadas)
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (id = (select auth.uid()));

-- Corrigindo as políticas da tabela `cart_items` (Init Plan & Duplicadas)
DROP POLICY IF EXISTS "Users can view own cart" ON public.cart_items;
CREATE POLICY "Users can view own cart" ON public.cart_items FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert into own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
CREATE POLICY "Users can insert own cart items" ON public.cart_items FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
CREATE POLICY "Users can update own cart items" ON public.cart_items FOR UPDATE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete from own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;
CREATE POLICY "Users can delete own cart items" ON public.cart_items FOR DELETE USING (user_id = (select auth.uid()));

-- Corrigindo as políticas da tabela `orders` e `order_items` (RLS Always True & Init Plan)
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Anyone can create order" ON public.orders;
CREATE POLICY "Anyone can create order" ON public.orders FOR INSERT WITH CHECK (
  user_id = (select auth.uid()) OR user_id IS NULL
);

DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = (select auth.uid()))
);

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = (select auth.uid()) OR orders.user_id IS NULL)
  )
);
