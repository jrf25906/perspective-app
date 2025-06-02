-- Create User Connections Table
-- Run this SQL script to create the missing user_connections table directly

-- Create the user_connections table
CREATE TABLE IF NOT EXISTS user_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    connection_type VARCHAR(20) DEFAULT 'friend',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_connections_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_user_connections_friend_id 
        FOREIGN KEY (friend_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate connections
    CONSTRAINT unique_connection UNIQUE(user_id, friend_id),
    
    -- Check constraint to prevent self-connections
    CONSTRAINT no_self_connection CHECK (user_id != friend_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_friend_id ON user_connections(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);
CREATE INDEX IF NOT EXISTS idx_user_connections_user_status ON user_connections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_connections_friend_status ON user_connections(friend_id, status);

-- Add table comment
COMMENT ON TABLE user_connections IS 'Manages social connections between users for friends features';

-- Verify table was created
SELECT 'User Connections table created successfully!' AS status; 