import Foundation

struct Perspective: Codable, Identifiable {
    let id: Int
    let userId: Int
    let title: String
    let content: String
    let category: String?
    let tags: [String]?
    let imageUrl: String?
    let isPublic: Bool
    let likesCount: Int
    let commentsCount: Int
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, title, content, category, tags
        case userId = "user_id"
        case imageUrl = "image_url"
        case isPublic = "is_public"
        case likesCount = "likes_count"
        case commentsCount = "comments_count"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
