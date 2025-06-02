import Foundation

// Test script to diagnose Challenge decoding issues

// Sample JSON response from backend (you can replace this with actual response)
let sampleJSON = """
{
    "id": 1,
    "type": "bias_swap",
    "title": "Media Bias Detection",
    "prompt": "Analyze the following news articles",
    "content": {
        "text": "Read the articles below",
        "articles": [
            {
                "title": "Test Article",
                "source": "Test Source",
                "url": "https://example.com",
                "summary": "Test summary",
                "bias_rating": 2.5,
                "published_at": "2024-01-15T10:00:00.000Z"
            }
        ],
        "questions": ["What bias do you see?"]
    },
    "options": [
        {
            "id": "A",
            "text": "Option A",
            "is_correct": true,
            "explanation": "This is correct"
        },
        {
            "id": "B", 
            "text": "Option B",
            "is_correct": false
        }
    ],
    "correct_answer": null,
    "explanation": "This challenge tests bias detection",
    "difficulty_level": 2,
    "required_articles": null,
    "is_active": true,
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T10:00:00.000Z",
    "estimated_time_minutes": 5
}
"""

// Function to test decoding
func testChallengeDecoding() {
    print("🔍 Testing Challenge JSON Decoding...")
    print("=====================================")
    
    guard let jsonData = sampleJSON.data(using: .utf8) else {
        print("❌ Failed to convert string to data")
        return
    }
    
    // Use the same decoder as the app
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .custom { decoder in
        let container = try decoder.singleValueContainer()
        let dateString = try container.decode(String.self)
        
        // Try different date formats
        let formatters = [
            ISO8601DateFormatter(),
            createDateFormatter("yyyy-MM-dd'T'HH:mm:ss.SSSZ"),
            createDateFormatter("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
            createDateFormatter("yyyy-MM-dd'T'HH:mm:ssZ"),
            createDateFormatter("yyyy-MM-dd'T'HH:mm:ss'Z'")
        ]
        
        for formatter in formatters {
            if let date = formatter.date(from: dateString) {
                return date
            }
        }
        
        throw DecodingError.dataCorruptedError(
            in: container,
            debugDescription: "Cannot decode date from '\(dateString)'"
        )
    }
    
    do {
        let challenge = try decoder.decode(Challenge.self, from: jsonData)
        print("✅ Successfully decoded challenge!")
        print("   ID: \(challenge.id)")
        print("   Title: \(challenge.title)")
        print("   Type: \(challenge.type.rawValue)")
        print("   Difficulty Level: \(challenge.difficultyLevel)")
        print("   Options count: \(challenge.options?.count ?? 0)")
        
        // Check content
        if let text = challenge.content.text {
            print("   Content text: \(text.prefix(50))...")
        }
        if let articles = challenge.content.articles {
            print("   Articles count: \(articles.count)")
        }
        
    } catch let error as DecodingError {
        print("❌ Decoding failed with error:")
        
        switch error {
        case .keyNotFound(let key, let context):
            print("   Key not found: '\(key.stringValue)'")
            print("   Coding path: \(context.codingPath.map { $0.stringValue }.joined(separator: " → "))")
            print("   Debug: \(context.debugDescription)")
            
        case .typeMismatch(let type, let context):
            print("   Type mismatch: Expected \(type)")
            print("   Coding path: \(context.codingPath.map { $0.stringValue }.joined(separator: " → "))")
            print("   Debug: \(context.debugDescription)")
            
        case .valueNotFound(let type, let context):
            print("   Value not found: \(type)")
            print("   Coding path: \(context.codingPath.map { $0.stringValue }.joined(separator: " → "))")
            
        case .dataCorrupted(let context):
            print("   Data corrupted")
            print("   Coding path: \(context.codingPath.map { $0.stringValue }.joined(separator: " → "))")
            print("   Debug: \(context.debugDescription)")
            
        @unknown default:
            print("   Unknown decoding error")
        }
        
        // Try to decode as dictionary to see what's actually there
        if let dict = try? JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any] {
            print("\n📋 Actual JSON structure:")
            printJSON(dict, indent: "   ")
        }
        
    } catch {
        print("❌ Unexpected error: \(error)")
    }
}

func createDateFormatter(_ format: String) -> DateFormatter {
    let formatter = DateFormatter()
    formatter.dateFormat = format
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    return formatter
}

func printJSON(_ obj: Any, indent: String = "") {
    if let dict = obj as? [String: Any] {
        for (key, value) in dict {
            if let subDict = value as? [String: Any] {
                print("\(indent)\(key):")
                printJSON(subDict, indent: indent + "  ")
            } else if let array = value as? [Any] {
                print("\(indent)\(key): [\(array.count) items]")
            } else {
                print("\(indent)\(key): \(value)")
            }
        }
    }
}

// Run the test
testChallengeDecoding() 