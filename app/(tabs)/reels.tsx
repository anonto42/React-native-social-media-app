import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Reel {
  id: string;
  content: string;
  media_url: string | null;
  likes_count: number;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  liked_by_user?: boolean;
}

export default function Reels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .eq('media_type', 'reel')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        const reelsWithLikes = await Promise.all(
          data.map(async (reel) => {
            const { data: likeData } = await supabase
              .from('likes')
              .select('id')
              .eq('post_id', reel.id)
              .eq('user_id', user?.id)
              .maybeSingle();

            return {
              ...reel,
              liked_by_user: !!likeData,
            };
          })
        );

        setReels(reelsWithLikes);
      }
    } catch (error) {
      console.error('Error loading reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reelId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', reelId)
          .eq('user_id', user?.id);

        await supabase.rpc('decrement_likes', { post_id: reelId });
      } else {
        await supabase.from('likes').insert({
          post_id: reelId,
          user_id: user?.id,
        });

        await supabase.rpc('increment_likes', { post_id: reelId });
      }

      setReels((prevReels) =>
        prevReels.map((reel) =>
          reel.id === reelId
            ? {
                ...reel,
                liked_by_user: !isLiked,
                likes_count: reel.likes_count + (isLiked ? -1 : 1),
              }
            : reel
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const renderReel = ({ item }: { item: Reel }) => (
    <View style={styles.reelContainer}>
      {item.media_url ? (
        <Image source={{ uri: item.media_url }} style={styles.reelMedia} />
      ) : (
        <View style={[styles.reelMedia, styles.reelPlaceholder]}>
          <Text style={styles.placeholderText}>Video Placeholder</Text>
        </View>
      )}

      <View style={styles.overlay}>
        <View style={styles.userInfo}>
          {item.profiles.avatar_url ? (
            <Image
              source={{ uri: item.profiles.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.profiles.full_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.fullName}>{item.profiles.full_name}</Text>
            <Text style={styles.username}>@{item.profiles.username}</Text>
          </View>
        </View>

        {item.content ? (
          <Text style={styles.content}>{item.content}</Text>
        ) : null}
      </View>

      <View style={styles.sideActions}>
        <TouchableOpacity
          style={styles.sideButton}
          onPress={() => handleLike(item.id, item.liked_by_user || false)}
        >
          <Heart
            color={item.liked_by_user ? '#ff3b30' : '#fff'}
            fill={item.liked_by_user ? '#ff3b30' : 'none'}
            size={32}
          />
          <Text style={styles.sideText}>{item.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideButton}>
          <MessageCircle color="#fff" size={32} />
          <Text style={styles.sideText}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideButton}>
          <Share2 color="#fff" size={32} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading reels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reels yet</Text>
            <Text style={styles.emptySubtext}>Be the first to create one!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  reelContainer: {
    height: SCREEN_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  reelMedia: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  reelPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 18,
  },
  overlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 80,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  fullName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  username: {
    fontSize: 14,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sideActions: {
    position: 'absolute',
    right: 12,
    bottom: 100,
  },
  sideButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sideText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emptyContainer: {
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});
