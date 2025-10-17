/*
  # Like Counter Functions

  1. Functions
    - `increment_likes` - Increments the likes_count for a post
    - `decrement_likes` - Decrements the likes_count for a post
  
  2. Purpose
    - These functions handle atomic updates to like counts
    - Prevents race conditions when multiple users like simultaneously
*/

CREATE OR REPLACE FUNCTION increment_likes(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_likes(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
