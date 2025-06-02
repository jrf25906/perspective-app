import db from '../db';
import logger from '../utils/logger';

export interface UserConnection {
  id: number;
  user_id: number;
  friend_id: number;
  status: ConnectionStatus;
  connection_type: ConnectionType;
  created_at: Date;
  updated_at: Date;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'blocked' | 'declined';
export type ConnectionType = 'friend' | 'follower' | 'blocked';

export interface ConnectionRequest {
  userId: number;
  friendId: number;
  connectionType?: ConnectionType;
}

export interface ConnectionStats {
  totalFriends: number;
  pendingRequests: number;
  sentRequests: number;
  mutualConnections: number;
}

/**
 * Service for managing user social connections
 * Follows Single Responsibility Principle - only handles user connections
 */
export class UserConnectionService {
  /**
   * Create a new connection request
   */
  async createConnection(request: ConnectionRequest): Promise<UserConnection> {
    const { userId, friendId, connectionType = 'friend' } = request;
    
    // Validate input
    if (userId === friendId) {
      throw new Error('Users cannot connect to themselves');
    }
    
    // Check if connection already exists
    const existing = await this.getConnection(userId, friendId);
    if (existing) {
      throw new Error('Connection already exists between these users');
    }
    
    const [connection] = await db('user_connections')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
        connection_type: connectionType,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    logger.info(`Connection request created: User ${userId} -> User ${friendId}`);
    
    return connection;
  }
  
  /**
   * Accept a pending connection request
   */
  async acceptConnection(userId: number, friendId: number): Promise<void> {
    const connection = await this.getConnection(friendId, userId);
    
    if (!connection) {
      throw new Error('No pending connection request found');
    }
    
    if (connection.status !== 'pending') {
      throw new Error(`Cannot accept connection with status: ${connection.status}`);
    }
    
    await db('user_connections')
      .where({ user_id: friendId, friend_id: userId })
      .update({ 
        status: 'accepted', 
        updated_at: new Date() 
      });
    
    logger.info(`Connection accepted: User ${friendId} <-> User ${userId}`);
  }
  
  /**
   * Decline a pending connection request
   */
  async declineConnection(userId: number, friendId: number): Promise<void> {
    await db('user_connections')
      .where({ user_id: friendId, friend_id: userId })
      .update({ 
        status: 'declined', 
        updated_at: new Date() 
      });
    
    logger.info(`Connection declined: User ${friendId} -> User ${userId}`);
  }
  
  /**
   * Block a user (prevents future connections)
   */
  async blockUser(userId: number, blockedUserId: number): Promise<void> {
    // Remove any existing connections
    await db('user_connections')
      .where(function() {
        this.where({ user_id: userId, friend_id: blockedUserId })
          .orWhere({ user_id: blockedUserId, friend_id: userId });
      })
      .delete();
    
    // Create block entry
    await db('user_connections')
      .insert({
        user_id: userId,
        friend_id: blockedUserId,
        status: 'blocked',
        connection_type: 'blocked',
        created_at: new Date(),
        updated_at: new Date()
      });
    
    logger.info(`User ${userId} blocked User ${blockedUserId}`);
  }
  
  /**
   * Remove a connection between users
   */
  async removeConnection(userId: number, friendId: number): Promise<void> {
    const deleted = await db('user_connections')
      .where(function() {
        this.where({ user_id: userId, friend_id: friendId })
          .orWhere({ user_id: friendId, friend_id: userId });
      })
      .where('status', 'accepted')
      .delete();
    
    if (deleted === 0) {
      throw new Error('No accepted connection found between these users');
    }
    
    logger.info(`Connection removed: User ${userId} <-> User ${friendId}`);
  }
  
  /**
   * Get connection between two users
   */
  async getConnection(userId: number, friendId: number): Promise<UserConnection | null> {
    return await db('user_connections')
      .where(function() {
        this.where({ user_id: userId, friend_id: friendId })
          .orWhere({ user_id: friendId, friend_id: userId });
      })
      .first();
  }
  
  /**
   * Get all friends of a user (accepted connections)
   */
  async getFriends(userId: number): Promise<number[]> {
    return await db('user_connections')
      .where(function() {
        this.where('user_id', userId).orWhere('friend_id', userId);
      })
      .where('status', 'accepted')
      .select(
        db.raw('CASE WHEN user_id = ? THEN friend_id ELSE user_id END as friend_id', [userId])
      )
      .pluck('friend_id');
  }
  
  /**
   * Get detailed friend information
   */
  async getFriendsWithDetails(userId: number): Promise<Array<{
    id: number;
    username: string;
    avatar_url?: string;
    connected_at: Date;
  }>> {
    return await db('user_connections as uc')
      .join('users as u', function() {
        this.on(function() {
          this.on('uc.user_id', '=', 'u.id').andOn('uc.friend_id', '=', db.raw('?', [userId]));
        }).orOn(function() {
          this.on('uc.friend_id', '=', 'u.id').andOn('uc.user_id', '=', db.raw('?', [userId]));
        });
      })
      .where('uc.status', 'accepted')
      .select(
        'u.id',
        'u.username',
        'u.avatar_url',
        'uc.created_at as connected_at'
      );
  }
  
  /**
   * Get pending connection requests (received)
   */
  async getPendingRequests(userId: number): Promise<Array<{
    id: number;
    username: string;
    avatar_url?: string;
    requested_at: Date;
  }>> {
    return await db('user_connections as uc')
      .join('users as u', 'uc.user_id', 'u.id')
      .where('uc.friend_id', userId)
      .where('uc.status', 'pending')
      .select(
        'u.id',
        'u.username', 
        'u.avatar_url',
        'uc.created_at as requested_at'
      );
  }
  
  /**
   * Get sent connection requests (sent by user)
   */
  async getSentRequests(userId: number): Promise<Array<{
    id: number;
    username: string;
    avatar_url?: string;
    requested_at: Date;
  }>> {
    return await db('user_connections as uc')
      .join('users as u', 'uc.friend_id', 'u.id')
      .where('uc.user_id', userId)
      .where('uc.status', 'pending')
      .select(
        'u.id',
        'u.username',
        'u.avatar_url', 
        'uc.created_at as requested_at'
      );
  }
  
  /**
   * Get connection statistics for a user
   */
  async getConnectionStats(userId: number): Promise<ConnectionStats> {
    const friends = await this.getFriends(userId);
    const pendingRequests = await this.getPendingRequests(userId);
    const sentRequests = await this.getSentRequests(userId);
    
    // Calculate mutual connections (friends of friends)
    const mutualConnections = new Set<number>();
    for (const friendId of friends) {
      const friendsFriends = await this.getFriends(friendId);
      friendsFriends.forEach(id => {
        if (id !== userId && !friends.includes(id)) {
          mutualConnections.add(id);
        }
      });
    }
    
    return {
      totalFriends: friends.length,
      pendingRequests: pendingRequests.length,
      sentRequests: sentRequests.length,
      mutualConnections: mutualConnections.size
    };
  }
  
  /**
   * Check if users are connected
   */
  async areConnected(userId: number, friendId: number): Promise<boolean> {
    const connection = await this.getConnection(userId, friendId);
    return connection?.status === 'accepted' || false;
  }
  
  /**
   * Check if user is blocked
   */
  async isBlocked(userId: number, potentialBlockedId: number): Promise<boolean> {
    const blockConnection = await db('user_connections')
      .where(function() {
        this.where({ user_id: userId, friend_id: potentialBlockedId })
          .orWhere({ user_id: potentialBlockedId, friend_id: userId });
      })
      .where('status', 'blocked')
      .first();
    
    return !!blockConnection;
  }
  
  /**
   * Search for users to connect with
   */
  async searchPotentialConnections(
    userId: number, 
    searchTerm: string, 
    limit: number = 20
  ): Promise<Array<{
    id: number;
    username: string;
    avatar_url?: string;
    connection_status?: ConnectionStatus;
    mutual_friends: number;
  }>> {
    // Get current connections
    const existingConnections = await db('user_connections')
      .where(function() {
        this.where('user_id', userId).orWhere('friend_id', userId);
      })
      .select('user_id', 'friend_id', 'status');
    
    const connectedUserIds = new Set<number>();
    existingConnections.forEach(conn => {
      connectedUserIds.add(conn.user_id === userId ? conn.friend_id : conn.user_id);
    });
    
    // Search for users
    const users = await db('users')
      .where('username', 'ilike', `%${searchTerm}%`)
      .where('id', '!=', userId)
      .whereNotIn('id', Array.from(connectedUserIds))
      .select('id', 'username', 'avatar_url')
      .limit(limit);
    
    // Add connection status and mutual friends count
    const results = await Promise.all(users.map(async (user) => {
      const mutualFriends = await this.getMutualFriendsCount(userId, user.id);
      const connectionStatus = existingConnections.find(conn => 
        (conn.user_id === userId && conn.friend_id === user.id) ||
        (conn.friend_id === userId && conn.user_id === user.id)
      )?.status;
      
      return {
        ...user,
        connection_status: connectionStatus,
        mutual_friends: mutualFriends
      };
    }));
    
    return results;
  }
  
  /**
   * Get count of mutual friends between two users
   */
  async getMutualFriendsCount(userId: number, otherUserId: number): Promise<number> {
    const userFriends = await this.getFriends(userId);
    const otherUserFriends = await this.getFriends(otherUserId);
    
    const mutualCount = userFriends.filter(id => otherUserFriends.includes(id)).length;
    return mutualCount;
  }
}

// Factory function for DI
export function createUserConnectionService(): UserConnectionService {
  return new UserConnectionService();
} 