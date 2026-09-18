-- Demo library for the hosted showcase.
--
-- Copies the 28 photographs from the development library into the demo
-- account, keeping every Gemini caption, tag, scene type and colour exactly
-- as the model produced them. The images themselves already live in
-- ImageKit, so these rows only point at them.
--
-- date_taken is demo data: stock images carry no EXIF date, and without one
-- the whole library groups under a single heading. created_at is the real
-- upload time. Nothing else is invented.
--
-- Safe to re-run: it clears the demo account's photos and albums first.
-- Run it in Neon's SQL Editor, or:
--   psql "$DATABASE_URL" -f scripts/seed-demo.sql

BEGIN;

-- Fails loudly rather than silently seeding nothing if the account is absent.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@google-photos-clone.app') THEN
    RAISE EXCEPTION 'Register demo@google-photos-clone.app first, then re-run this script';
  END IF;
END $$;

-- Start from a clean slate so re-running resets the demo.
DELETE FROM album_photos WHERE album_id IN (SELECT a.id FROM albums a JOIN users u ON u.id = a.user_id WHERE u.email = 'demo@google-photos-clone.app');
UPDATE albums SET cover_photo_id = NULL WHERE user_id = (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app');
DELETE FROM albums WHERE user_id = (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app');
DELETE FROM shared_links WHERE photo_id IN (SELECT id FROM photos WHERE user_id = (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'));
DELETE FROM photos WHERE user_id = (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app');

-- Photos ---------------------------------------------------------------
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('2c4d95ca-3d97-4cae-bd36-8578a948dc86', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'castle-garden_YUiJxHHH2.jpg', 'castle-garden.jpg', '6aab942aead997d09a8739bf', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/castle-garden_YUiJxHHH2.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/castle-garden_YUiJxHHH2.jpg', 'image/jpeg', 497072, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:18:02.313236+00', '2026-03-08 13:10:00+00', 'A wide shot of the grand Château de Chambord under a cloudy sky, with a long gravel path leading towards the entrance.', 'architecture, building, castle, chambord, chateau, clouds, french, historic, landmark, lawn, palace, path, sky', 'architecture', 'blue, green, gray, white', '2026-09-17 13:18:28.487179+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('3b70709d-450e-4e7a-9002-45eacd0924be', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'lighthouse_LAN9TeLpB.jpg', 'lighthouse.jpg', '6aab9421ead997d09a86e6cb', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/lighthouse_LAN9TeLpB.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/lighthouse_LAN9TeLpB.jpg', 'image/jpeg', 326298, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:54.222918+00', '2025-11-23 11:40:00+00', 'A black and white photo of a lighthouse standing among rocks under a cloudy sky.', 'architecture, black and white, building, coast, historical, lighthouse, monochrome, rocks, scenic, tower', 'architecture', 'black, white, gray', '2026-09-17 13:20:00.8068+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('7a4c3e38-1955-42f6-9c58-2b55d289ddae', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'old-cabin_7yzKba5xz.jpg', 'old-cabin.jpg', '6aab9423ead997d09a86f783', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/old-cabin_7yzKba5xz.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/old-cabin_7yzKba5xz.jpg', 'image/jpeg', 894749, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:56.143861+00', '2025-11-23 14:15:00+00', 'A vintage green bicycle leans against the weathered wooden wall of a rustic shed with a peeling blue door.', 'architecture, bicycle, blue, door, green, old, rustic, shed, vintage, wall, wooden', 'architecture', 'brown, green, blue', '2026-09-17 13:19:39.918271+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('1ce20c4d-196d-44ce-b36b-04886e53cd90', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'santorini-village_q2ExPCq3gO.jpg', 'santorini-village.jpg', '6aab9420ead997d09a86d73f', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/santorini-village_q2ExPCq3gO.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/santorini-village_q2ExPCq3gO.jpg', 'image/jpeg', 223506, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:17:52.604024+00', '2025-07-05 19:20:00+00', 'A scenic view of whitewashed cliffside buildings and traditional windmills in Oia, Santorini, Greece.', 'cycladic architecture, dome, greece, greek flag, mediterranean, oia, santorini, travel, whitewashed, windmill', 'architecture', 'white, light blue, beige', '2026-09-17 13:01:46.205245+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('d1f00499-a971-41a4-a351-388e8c5d7533', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'coffee-cup_MXJnXa6WP.jpg', 'coffee-cup.jpg', '6aab954eead997d09a91a980', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/coffee-cup_MXJnXa6WP.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/coffee-cup_MXJnXa6WP.jpg', 'image/jpeg', 73163, 1800, 1800, 'ACTIVE', false, '2026-09-17 07:22:54.601914+00', '2025-07-06 08:05:00+00', 'A top-down view of a white ceramic mug filled with coffee on a vibrant red background.', 'beverage, caffeine, coffee, cup, drink, latte, mug, red background, top view, white', 'food', 'red, white, brown', '2026-09-17 13:18:15.083824+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('e757b2c2-dfaa-43c4-831f-df5ce1c1800c', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'raspberries_IKq3fdzF5.jpg', 'raspberries.jpg', '6aab954eead997d09a91aa35', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/raspberries_IKq3fdzF5.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/raspberries_IKq3fdzF5.jpg', 'image/jpeg', 174787, 1800, 1800, 'ACTIVE', false, '2026-09-17 07:22:54.651231+00', '2025-07-06 09:30:00+00', 'Several fresh raspberries sit on a rustic wooden surface against a warm, glowing golden background.', 'food, fresh, fruit, golden hour, nature, raspberries, summer, sweet, warm lighting, wooden surface', 'food', 'gold, red, white', '2026-09-17 13:17:43.517357+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('a6caaece-459b-43db-a36f-3ee5d3028cbc', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'beach-pier_adZdgwRGG.jpg', 'beach-pier.jpg', '6aab9424ead997d09a86fe27', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/beach-pier_adZdgwRGG.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/beach-pier_adZdgwRGG.jpg', 'image/jpeg', 517440, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:56.760332+00', '2025-06-21 18:45:00+00', 'A wooden pier stretches across calm turquoise water toward a thatched-roof pavilion under a hazy sky.', 'boardwalk, horizon, hut, ocean, pier, resort, sea, sky, tropical, vacation, water', 'landscape', 'blue, brown, white', '2026-09-17 13:19:32.987472+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('5209289b-d341-4226-a197-cd56acfe5b2d', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'city-skyline-bay_PQK5Z7kkwP.jpg', 'city-skyline-bay.jpg', '6aab9422ead997d09a86ec0c', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-skyline-bay_PQK5Z7kkwP.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-skyline-bay_PQK5Z7kkwP.jpg', 'image/jpeg', 376594, 2800, 1200, 'ACTIVE', false, '2026-09-17 07:17:54.919932+00', '2026-04-19 17:30:00+00', 'A person rowing a small boat on the water with the San Francisco skyline and a bridge in the background.', 'bay bridge, boat, cityscape, horizon, landmark, ocean, rowing, san francisco, skyline, water', 'landscape', 'blue, white, gray', '2026-09-17 13:19:47.921515+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('b272b8d8-ac4a-46be-ae51-713157b64e3b', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'coast-forest-view_CNjKAvlp8H.jpg', 'coast-forest-view.jpg', '6aab941bead997d09a86ac36', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/coast-forest-view_CNjKAvlp8H.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/coast-forest-view_CNjKAvlp8H.jpg', 'image/jpeg', 505464, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:48.027637+00', '2025-10-11 13:20:00+00', 'A scenic landscape featuring a dense green forest in the foreground, a vast blue body of water, and distant mountains under a clear sky.', 'forest, horizon, landscape, mountains, nature, ocean, outdoors, scenic, sea, sky, trees, water', 'landscape', 'blue, green, teal', '2026-09-17 13:21:09.895934+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('3fb9dc1d-0e6b-4bcd-be9f-e579b4356d1d', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'desert-canyon_xFGy4Qp29j.jpg', 'desert-canyon.jpg', '6aab941eead997d09a86c487', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/desert-canyon_xFGy4Qp29j.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/desert-canyon_xFGy4Qp29j.jpg', 'image/jpeg', 358409, 2800, 1200, 'ACTIVE', false, '2026-09-17 07:17:50.792337+00', '2026-04-19 09:45:00+00', 'A wide-angle landscape view showing rolling brown hills under a clear blue sky.', 'hills, horizon, landscape, mountains, nature, outdoors, panorama, scenery, sky, terrain, valley, wilderness', 'landscape', 'blue, brown, gold', '2026-09-17 13:20:31.623534+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('19b5870a-4632-44ef-a438-5ddf59265287', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'forest-path_QoHGvwiAY.jpg', 'forest-path.jpg', '6aab941bead997d09a86ac2a', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/forest-path_QoHGvwiAY.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/forest-path_QoHGvwiAY.jpg', 'image/jpeg', 795140, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:48.027637+00', '2025-10-11 10:50:00+00', 'A narrow gravel pathway winds through lush green grass toward a line of flowering trees and a dark forest under a bright blue sky.', 'blooming trees, forest, grass, landscape, nature, outdoors, pathway, spring, trail, trees, walkway', 'landscape', 'green, blue, gray, white', '2026-09-17 13:20:53.421362+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('3632b0ef-5061-444a-a154-ab7b026001a2', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'golden-sunset_0SC8i8n-5.jpg', 'golden-sunset.jpg', '6aab9427ead997d09a871e06', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/golden-sunset_0SC8i8n-5.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/golden-sunset_0SC8i8n-5.jpg', 'image/jpeg', 581261, 2800, 1200, 'ACTIVE', true, '2026-09-17 07:17:59.853078+00', '2025-10-12 18:05:00+00', 'A tranquil meadow with trees and grazing cattle under a vibrant golden sunset sky.', 'cows, fields, golden hour, grass, landscape, meadow, nature, sunrise, sunset, trees', 'landscape', 'gold, green, brown', '2026-09-17 13:18:55.974443+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('a5ddef14-360a-466e-97f1-31b65109c89b', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'mountain-glacier_oGXu4yX3n.jpg', 'mountain-glacier.jpg', '6aab941eead997d09a86c47d', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-glacier_oGXu4yX3n.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-glacier_oGXu4yX3n.jpg', 'image/jpeg', 1042418, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:17:50.788742+00', '2025-04-13 09:15:00+00', 'A breathtaking landscape view of snow-capped mountains under a clear blue sky.', 'blue sky, himalayas, landscape, mount everest, mountain, nature, outdoors, peaks, scenic, snow, valley, winter', 'landscape', 'blue, white, gray', '2026-09-17 13:20:41.109729+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('93108159-3914-4367-b5b6-f71582b76605', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'mountain-lake_HViqynBZu.jpg', 'mountain-lake.jpg', '6aab9429ead997d09a873577', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-lake_HViqynBZu.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-lake_HViqynBZu.jpg', 'image/jpeg', 509542, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:18:01.936969+00', '2025-04-12 08:20:00+00', 'A tranquil lake landscape with tall green reeds in the foreground, a wooden pier, and distant misty mountains under a soft sky.', 'horizon, lake, landscape, mountains, nature, pier, reeds, scenic, sunset, trees, water', 'landscape', 'blue, green, brown', '2026-09-17 13:18:35.030426+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('02bda5de-291c-419c-baa1-b58654bc9fd9', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'mountain-valley_CK0nRkrFX.jpg', 'mountain-valley.jpg', '6aab941eead997d09a86c4c9', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-valley_CK0nRkrFX.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-valley_CK0nRkrFX.jpg', 'image/jpeg', 892629, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:50.822399+00', '2025-04-12 11:05:00+00', 'A scenic view looking down a rocky waterfall surrounded by lush green forest under a partly cloudy sky.', 'forest, green, landscape, nature, outdoors, rocks, scenic, sky, stream, trees, valley, waterfall', 'landscape', 'green, gray, blue, white', '2026-09-17 13:20:25.201521+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('2e4ddeae-dec2-4646-9a61-4beb55b63dd5', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'mountain-waterfall_i_cqW52Rz.jpg', 'mountain-waterfall.jpg', '6aab941bead997d09a86aac4', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-waterfall_i_cqW52Rz.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/mountain-waterfall_i_cqW52Rz.jpg', 'image/jpeg', 520370, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:48.027637+00', '2025-04-12 14:40:00+00', 'A tall waterfall cascades down a rocky, moss-covered cliff into a stream surrounded by dense green forest.', 'forest, landscape, moss, nature, rocks, stream, trees, water, waterfall, wilderness', 'landscape', 'green, gray, white', '2026-09-17 13:21:01.849735+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('eccf9d67-a56d-4625-a26d-4e138c182e5d', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'summer-sky_TtPKOxLL7b.jpg', 'summer-sky.jpg', '6aab9420ead997d09a86daa3', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/summer-sky_TtPKOxLL7b.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/summer-sky_TtPKOxLL7b.jpg', 'image/jpeg', 328732, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:52.950628+00', '2025-04-13 12:30:00+00', 'A group of hikers stand triumphantly atop a rocky mountain peak against a bright blue sky filled with fluffy white clouds.', 'adventure, blue sky, clouds, group, hikers, mountain, nature, outdoors, peak, rocks, sky, summit', 'landscape', 'blue, white, brown, gray', '2026-09-17 13:20:08.451411+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('87e38012-1417-4919-92d6-90f32ae0a3db', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'turquoise-lake_LU5Ve-eBl.jpg', 'turquoise-lake.jpg', '6aab9428ead997d09a872381', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/turquoise-lake_LU5Ve-eBl.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/turquoise-lake_LU5Ve-eBl.jpg', 'image/jpeg', 363503, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:18:00.237656+00', '2025-06-21 10:10:00+00', 'A small orange fishing boat with a Greek flag floats in calm turquoise waters.', 'boat, calm, flag, greece, greek flag, nature, ocean, orange, sea, transportation, turquoise, water', 'landscape', 'turquoise, blue, orange, white', '2026-09-17 13:18:41.415074+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('17c81ca0-0875-45ae-b18e-cc912df2bd69', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'cherry-blossom_iP7QexZgY.jpg', 'cherry-blossom.jpg', '6aab9424ead997d09a86feeb', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/cherry-blossom_iP7QexZgY.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/cherry-blossom_iP7QexZgY.jpg', 'image/jpeg', 283098, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:17:56.838992+00', '2026-02-14 12:25:00+00', 'A close-up view of delicate cherry blossoms blooming on tree branches against a soft background.', 'bloom, botanical, branches, cherry blossoms, floral, flowers, macro, nature, pink, plants, spring, tree, white', 'macro', 'white, pink, teal, brown', '2026-09-17 13:19:25.796278+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('b1058d65-f594-412a-b01c-293d82c88b55', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'purple-flower_kxViuY-z07.jpg', 'purple-flower.jpg', '6aab954eead997d09a91a9dd', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/purple-flower_kxViuY-z07.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/purple-flower_kxViuY-z07.jpg', 'image/jpeg', 203184, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:22:54.643243+00', '2026-02-14 15:40:00+00', 'A close-up shot of a vibrant purple flower with a water droplet on its petal.', 'bloom, close up, floral, flower, macro, nature, petal, plant, purple, water drop', 'macro', 'purple, green, black, yellow', '2026-09-17 13:18:09.562418+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('71542201-7e51-41f7-abe5-a4651897c5f0', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'bridge-at-night_F9O3foiFF.jpg', 'bridge-at-night.jpg', '6aab9425ead997d09a870cdb', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/bridge-at-night_F9O3foiFF.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/bridge-at-night_F9O3foiFF.jpg', 'image/jpeg', 194567, 1600, 2400, 'ACTIVE', true, '2026-09-17 07:17:57.996976+00', '2025-08-18 22:40:00+00', 'A stunning low-angle view of a suspension bridge illuminated at night against a cloudy twilight sky.', 'architecture, bridge, clouds, engineering, illuminated, lights, night, sky, structure, suspension bridge, twilight', 'night', 'blue, gold, gray, black', '2026-09-17 13:19:19.286853+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('a9ce2556-6b8b-42e3-968a-7a439cf567e4', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'city-night-lights_ICginMZxY.jpg', 'city-night-lights.jpg', '6aab9427ead997d09a8720bf', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-night-lights_ICginMZxY.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-night-lights_ICginMZxY.jpg', 'image/jpeg', 249691, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:18:00.052673+00', '2025-08-18 21:35:00+00', 'A nighttime view of the Millennium Bridge illuminated against the London skyline with St. Paul''s Cathedral in the background.', 'architecture, bridge, cityscape, dark, lights, london, millennium bridge, night, river, st pauls cathedral', 'night', 'black, gray, white', '2026-09-17 13:18:48.383934+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('9581d5b4-5668-4283-9f04-f2b8dd0c1594', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'canal-houses_SVz0hDvXs.jpg', 'canal-houses.jpg', '6aab942aead997d09a873b19', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/canal-houses_SVz0hDvXs.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/canal-houses_SVz0hDvXs.jpg', 'image/jpeg', 506173, 2400, 1600, 'ACTIVE', true, '2026-09-17 07:18:02.514214+00', '2025-08-17 15:25:00+00', 'A scenic canal in Bruges, Belgium, lined with historic buildings, wooden walkways, and small boats.', 'architecture, belgium, boats, bruges, buildings, canal, european, historic, town, waterway', 'outdoor', 'blue, brown, white, gold', '2026-09-17 13:18:21.793684+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('aec2e887-d0df-4ed3-8c61-8c8cec95df62', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'city-street_hdwoTUCdS.jpg', 'city-street.jpg', '6aab9420ead997d09a86d9ea', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-street_hdwoTUCdS.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-street_hdwoTUCdS.jpg', 'image/jpeg', 596304, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:52.892554+00', '2025-08-17 17:50:00+00', 'A narrow cobblestone street lined with historic brick and stone buildings under a clear blue sky.', 'brick architecture, cityscape, cobblestone street, fire escapes, historic buildings, historic district, new york street, streetscape, sunlight, urban canyon', 'outdoor', 'blue, red, brown, gray', '2026-09-17 13:20:17.226673+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('ccfb85ea-435b-4f9b-9c2a-a0517644ed28', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'city-traffic_j-hHiWHSK.jpg', 'city-traffic.jpg', '6aab9426ead997d09a871212', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-traffic_j-hHiWHSK.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/city-traffic_j-hHiWHSK.jpg', 'image/jpeg', 358166, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:58.398529+00', '2026-05-30 08:55:00+00', 'A high-angle black and white photograph captures heavy traffic flowing down a multi-lane city avenue bordered by palm trees and buildings.', 'aerial view, avenue, black and white, cars, city, palm trees, road, street, traffic, transportation, urban, vehicles', 'outdoor', 'black, white, gray', '2026-09-17 13:19:12.815776+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('8f44eaa4-678c-482e-9392-05ad1a8e8dba', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'vineyard-grapes_pnrnyYOVx.jpg', 'vineyard-grapes.jpg', '6aab9422ead997d09a86e999', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/vineyard-grapes_pnrnyYOVx.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/vineyard-grapes_pnrnyYOVx.jpg', 'image/jpeg', 431383, 1600, 2400, 'ACTIVE', false, '2026-09-17 07:17:54.681138+00', '2025-09-02 16:15:00+00', 'A close-up view of ripe dark grapes hanging on the vine amidst green and yellow leaves.', 'agriculture, cluster, fruit, grapes, harvest, leaves, nature, ripe, vine, vineyard, wine grapes', 'outdoor', 'green, purple, brown', '2026-09-17 13:19:54.525295+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('efffe387-d9e5-4122-9b94-5e7a9e65ec15', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'wildflowers_EU30_WzSQ.jpg', 'wildflowers.jpg', '6aab9426ead997d09a871470', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/wildflowers_EU30_WzSQ.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/wildflowers_EU30_WzSQ.jpg', 'image/jpeg', 348469, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:17:58.678441+00', '2026-06-15 11:15:00+00', 'Clusters of pink plumeria flowers bloom against a bright blue sky on a tree branch.', 'blooms, blue sky, branches, flora, flowers, frangipani, leaves, nature, outdoors, pink flowers, plumeria, sky, tree', 'outdoor', 'blue, pink, green, brown', '2026-09-17 13:19:06.41871+00');
INSERT INTO photos (id, user_id, file_name, original_file_name, imagekit_file_id, url,
  thumbnail_url, mime_type, size_bytes, width, height, status, starred, created_at,
  date_taken, ai_caption, ai_tags, ai_scene_type, ai_dominant_colors, ai_processed_at)
VALUES ('de3cc578-bf5b-4cbf-acf0-634ee62a77cf', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'vintage-car_Z63LvZJlT.jpg', 'vintage-car.jpg', '6aab9550ead997d09a91c2d1', 'https://ik.imagekit.io/punitbhardwaj/users/9c5fb857-0397-473a-92d6-7adced1392dc/vintage-car_Z63LvZJlT.jpg', 'https://ik.imagekit.io/punitbhardwaj/tr:n-ik_ml_thumbnail/users/9c5fb857-0397-473a-92d6-7adced1392dc/vintage-car_Z63LvZJlT.jpg', 'image/jpeg', 482444, 2400, 1600, 'ACTIVE', false, '2026-09-17 07:22:56.323096+00', '2026-05-30 16:20:00+00', 'A vintage custom car with a California 1938 license plate parked on a city street.', 'antique, automotive, car show, city, classic car, custom car, hot rod, retro, street, transportation, vehicle, vintage car', 'vehicle', 'gold, brown, black, gray', '2026-09-17 13:18:02.826264+00');

-- Albums ---------------------------------------------------------------
INSERT INTO albums (id, user_id, title, cover_photo_id, created_at, updated_at)
VALUES ('6b07773a-6614-4218-bf2a-6288bd72b98b', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'Landscapes', '93108159-3914-4367-b5b6-f71582b76605', now(), now());
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('f9947961-a0ab-4c47-aa5e-8d5b2c999020', '6b07773a-6614-4218-bf2a-6288bd72b98b', '93108159-3914-4367-b5b6-f71582b76605', now(), 0);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('b1c83b3d-07ee-467b-aead-126867aaa14e', '6b07773a-6614-4218-bf2a-6288bd72b98b', '3632b0ef-5061-444a-a154-ab7b026001a2', now(), 1);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('a6b8750f-dadc-4826-b3b8-50ef2ff0d589', '6b07773a-6614-4218-bf2a-6288bd72b98b', '87e38012-1417-4919-92d6-90f32ae0a3db', now(), 2);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('e280d5b3-bb3c-429e-b6c2-c86bed5358ba', '6b07773a-6614-4218-bf2a-6288bd72b98b', 'a5ddef14-360a-466e-97f1-31b65109c89b', now(), 3);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('d73bcb2f-1646-4143-a16c-f66440b7bf8a', '6b07773a-6614-4218-bf2a-6288bd72b98b', '02bda5de-291c-419c-baa1-b58654bc9fd9', now(), 4);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('a91d51ff-ae95-4475-83b6-d71b50c34947', '6b07773a-6614-4218-bf2a-6288bd72b98b', '2e4ddeae-dec2-4646-9a61-4beb55b63dd5', now(), 5);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('a9896fab-eb40-42e4-a5ec-4031b11d1075', '6b07773a-6614-4218-bf2a-6288bd72b98b', 'eccf9d67-a56d-4625-a26d-4e138c182e5d', now(), 6);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('3c7394bd-c8f1-4484-81b8-d56e0251e679', '6b07773a-6614-4218-bf2a-6288bd72b98b', 'a6caaece-459b-43db-a36f-3ee5d3028cbc', now(), 7);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('c9063ba7-6b9b-425f-b888-09b4090468c9', '6b07773a-6614-4218-bf2a-6288bd72b98b', 'b272b8d8-ac4a-46be-ae51-713157b64e3b', now(), 8);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('ae9b6c92-24c4-4c32-acb9-733028c91849', '6b07773a-6614-4218-bf2a-6288bd72b98b', '3fb9dc1d-0e6b-4bcd-be9f-e579b4356d1d', now(), 9);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('34b07287-064a-41a3-a88c-f980455adaf9', '6b07773a-6614-4218-bf2a-6288bd72b98b', '19b5870a-4632-44ef-a438-5ddf59265287', now(), 10);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('cc930e00-ee8a-4197-ad75-44505f993155', '6b07773a-6614-4218-bf2a-6288bd72b98b', '5209289b-d341-4226-a197-cd56acfe5b2d', now(), 11);

INSERT INTO albums (id, user_id, title, cover_photo_id, created_at, updated_at)
VALUES ('c2f1cc97-39eb-4356-b891-0b0683bb2284', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'Architecture', '1ce20c4d-196d-44ce-b36b-04886e53cd90', now(), now());
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('83558c4f-f5b0-400a-ab66-2570084cdde6', 'c2f1cc97-39eb-4356-b891-0b0683bb2284', '1ce20c4d-196d-44ce-b36b-04886e53cd90', now(), 0);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('bf65cd3a-dfdd-4fd0-8e07-c737797bf535', 'c2f1cc97-39eb-4356-b891-0b0683bb2284', '2c4d95ca-3d97-4cae-bd36-8578a948dc86', now(), 1);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('02e89f8b-483b-4da0-8736-2f6b778a1de6', 'c2f1cc97-39eb-4356-b891-0b0683bb2284', '3b70709d-450e-4e7a-9002-45eacd0924be', now(), 2);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('092d0d5e-2a7c-49ba-b042-11cc512ffa02', 'c2f1cc97-39eb-4356-b891-0b0683bb2284', '7a4c3e38-1955-42f6-9c58-2b55d289ddae', now(), 3);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('41a8a893-8343-43e1-849c-0a449ba71aca', 'c2f1cc97-39eb-4356-b891-0b0683bb2284', 'aec2e887-d0df-4ed3-8c61-8c8cec95df62', now(), 4);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('fccb5742-c30e-43d6-8410-4098c860ba3d', 'c2f1cc97-39eb-4356-b891-0b0683bb2284', '9581d5b4-5668-4283-9f04-f2b8dd0c1594', now(), 5);

INSERT INTO albums (id, user_id, title, cover_photo_id, created_at, updated_at)
VALUES ('e4f710b2-3760-400c-b031-40bf7c64263f', (SELECT id FROM users WHERE email = 'demo@google-photos-clone.app'), 'Travel', '9581d5b4-5668-4283-9f04-f2b8dd0c1594', now(), now());
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('af34097f-118b-4cef-826f-b0830df6a056', 'e4f710b2-3760-400c-b031-40bf7c64263f', '9581d5b4-5668-4283-9f04-f2b8dd0c1594', now(), 0);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('b05e5c48-6cb5-43d8-8d19-1737e26b9b19', 'e4f710b2-3760-400c-b031-40bf7c64263f', '1ce20c4d-196d-44ce-b36b-04886e53cd90', now(), 1);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('92d36b87-5324-4d6f-99ed-83b907e9d914', 'e4f710b2-3760-400c-b031-40bf7c64263f', 'a9ce2556-6b8b-42e3-968a-7a439cf567e4', now(), 2);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('34a0ec4c-d92d-4b69-aab4-0f75dc250bee', 'e4f710b2-3760-400c-b031-40bf7c64263f', '71542201-7e51-41f7-abe5-a4651897c5f0', now(), 3);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('cb547582-d61b-4520-b9d1-4245a2c1dac5', 'e4f710b2-3760-400c-b031-40bf7c64263f', '5209289b-d341-4226-a197-cd56acfe5b2d', now(), 4);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('06e22580-4129-41e7-9f76-281b51ae4599', 'e4f710b2-3760-400c-b031-40bf7c64263f', 'a6caaece-459b-43db-a36f-3ee5d3028cbc', now(), 5);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('d57bf9b6-ea30-4517-a0ca-970e18119e51', 'e4f710b2-3760-400c-b031-40bf7c64263f', '3fb9dc1d-0e6b-4bcd-be9f-e579b4356d1d', now(), 6);
INSERT INTO album_photos (id, album_id, photo_id, added_at, sort_order)
VALUES ('16959dec-84db-4ed2-a952-30573df2faa8', 'e4f710b2-3760-400c-b031-40bf7c64263f', '8f44eaa4-678c-482e-9392-05ad1a8e8dba', now(), 7);

COMMIT;

-- Expect: 28 photos, 8 starred, 3 albums (12 / 6 / 8 photos).
SELECT (SELECT count(*) FROM photos p JOIN users u ON u.id = p.user_id WHERE u.email = 'demo@google-photos-clone.app') AS photos,
       (SELECT count(*) FROM photos p JOIN users u ON u.id = p.user_id WHERE u.email = 'demo@google-photos-clone.app' AND p.starred) AS starred,
       (SELECT count(*) FROM albums a JOIN users u ON u.id = a.user_id WHERE u.email = 'demo@google-photos-clone.app') AS albums;
