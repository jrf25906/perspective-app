import Foundation

struct NewsArticle: Codable, Identifiable {
    let id: Int
    let title: String
    let content: String
    let source: String
    let author: String?
    let url: String
    let imageUrl: String?
    let category: String?
    let biasRating: Double? // -3.0 to +3.0
    let biasSource: String?
    let tags: [String]?
    let publishedAt: Date
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, title, content, source, author, url, category, tags
        case imageUrl = "image_url"
        case biasRating = "bias_rating"
        case biasSource = "bias_source"
        case publishedAt = "published_at"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
    
    var biasLabel: String {
        guard let rating = biasRating else { return "Unknown" }
        
        switch rating {
        case -3.0..<(-1.5): return "Left"
        case -1.5..<(-0.5): return "Lean Left"
        case -0.5...0.5: return "Center"
        case 0.5..<1.5: return "Lean Right"
        case 1.5...3.0: return "Right"
        default: return "Unknown"
        }
    }
    
    var biasColor: Color {
        guard let rating = biasRating else { return .gray }
        
        switch rating {
        case -3.0..<(-1.5): return .blue
        case -1.5..<(-0.5): return .cyan
        case -0.5...0.5: return .green
        case 0.5..<1.5: return .orange
        case 1.5...3.0: return .red
        default: return .gray
        }
    }
} 