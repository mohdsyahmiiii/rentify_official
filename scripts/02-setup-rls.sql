-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Only admins can manage categories" ON categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Items policies
CREATE POLICY "Anyone can view approved items" ON items FOR SELECT USING (
  status = 'approved' OR owner_id = auth.uid()
);
CREATE POLICY "Users can insert own items" ON items FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own items" ON items FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own items" ON items FOR DELETE USING (auth.uid() = owner_id);

-- Rentals policies
CREATE POLICY "Users can view own rentals" ON rentals FOR SELECT USING (
  auth.uid() = renter_id OR auth.uid() = owner_id
);
CREATE POLICY "Users can create rentals" ON rentals FOR INSERT WITH CHECK (auth.uid() = renter_id);
CREATE POLICY "Users can update own rentals" ON rentals FOR UPDATE USING (
  auth.uid() = renter_id OR auth.uid() = owner_id
);

-- Reviews policies
CREATE POLICY "Anyone can view public reviews" ON reviews FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own reviews" ON reviews FOR SELECT USING (
  auth.uid() = reviewer_id OR auth.uid() = reviewee_id
);
CREATE POLICY "Users can create reviews for their rentals" ON reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM rentals 
    WHERE rentals.id = rental_id 
    AND (rentals.renter_id = auth.uid() OR rentals.owner_id = auth.uid())
    AND rentals.status = 'completed'
  )
);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);

-- Reports policies
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
