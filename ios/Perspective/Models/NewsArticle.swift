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
    let biasRating: Double?
    let biasSource: String?
    let tags: [String]?
    let publishedAt: Date
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date
}