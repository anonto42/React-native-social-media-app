import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Grid, Video, UserPlus, UserCheck } from 'lucide-react-native';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
}

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string;
  likes_count: number;
  created_at: string;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    posts: 0,
    friends: 0,
  });

  useEffect(() => {
    loadUserProfile();
  }, [id, activeTab]);

  const loadUserProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (profileError) throw profileError;
      setUserProfile(profileData);

      const { data: friendshipData } = await supabase
        .from('friendships')
        .select('id, status')
        .or(
          `and(user_id.eq.${currentUser?.id},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${currentUser?.id})`
        )
        .maybeSingle();

      if (friendshipData) {
        setFriendshipStatus(friendshipData.status);
        setFriendshipId(friendshipData.id);
      }

      await Promise.all([loadPosts(), loadStats()]);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const mediaType = activeTab === 'posts' ? 'image' : 'reel';
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id)
        .eq('media_type', mediaType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [postsResult, friendsResult] = await Promise.all([
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', id),
        supabase
          .from('friendships')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', id)
          .eq('status', 'accepted'),
      ]);

      setStats({
        posts: postsResult.count || 0,
        friends: friendsResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFriendAction = async () => {
    try {
      if (friendshipStatus === 'accepted') {
        if (friendshipId) {
          await supabase.from('friendships').delete().eq('id', friendshipId);
          setFriendshipStatus(null);
          setFriendshipId(null);
        }
      } else if (friendshipStatus === 'pending') {
        return;
      } else {
        const { data, error } = await supabase
          .from('friendships')
          .insert({
            user_id: currentUser?.id,
            friend_id: id,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;
        setFriendshipStatus('pending');
        setFriendshipId(data.id);
      }
    } catch (error) {
      console.error('Error managing friendship:', error);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.gridItem}>
      {item.media_url ? (
        <Image source={{ uri: item.media_url }} style={styles.gridImage} />
      ) : (
        <View style={[styles.gridImage, styles.gridPlaceholder]}>
          <Text style={styles.placeholderText}>No image</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.centerContainer}>
        <Text>User not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userProfile.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            {userProfile.avatar_url ? (
              <Image
                source={{ uri: userProfile.avatar_url }}
                style={styles.profileAvatar}
              />
            ) : (
              <View style={[styles.profileAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {userProfile.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.friends}</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.fullName}>{userProfile.full_name}</Text>
            <Text style={styles.username}>@{userProfile.username}</Text>
            {userProfile.bio ? (
              <Text style={styles.bio}>{userProfile.bio}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              friendshipStatus === 'accepted' && styles.friendButton,
            ]}
            onPress={handleFriendAction}
            disabled={friendshipStatus === 'pending'}
          >
            {friendshipStatus === 'accepted' ? (
              <>
                <UserCheck color="#fff" size={20} />
                <Text style={styles.actionButtonText}>Friends</Text>
              </>
            ) : friendshipStatus === 'pending' ? (
              <Text style={styles.actionButtonText}>Pending</Text>
            ) : (
              <>
                <UserPlus color="#fff" size={20} />
                <Text style={styles.actionButtonText}>Add Friend</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Grid color={activeTab === 'posts' ? '#000' : '#666'} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
            onPress={() => setActiveTab('reels')}
          >
            <Video color={activeTab === 'reels' ? '#000' : '#666'} size={24} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {activeTab === 'posts' ? 'posts' : 'reels'} yet
              </Text>
            </View>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileSection: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  profileInfo: {
    marginBottom: 16,
  },
  fullName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  friendButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  grid: {
    paddingTop: 1,
  },
  gridItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  gridPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
