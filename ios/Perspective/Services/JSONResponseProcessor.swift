import Foundation

// MARK: - JSON Response Processing Protocol (Dependency Inversion Principle)

protocol JSONResponseProcessing {
    func processResponse(_ data: Data) -> ProcessedJSONResponse
}

// MARK: - Processed Response Result

struct ProcessedJSONResponse {
    let cleanedData: Data
    let originalData: Data
    let diagnostics: JSONDiagnostics
    let isValid: Bool
}

struct JSONDiagnostics {
    let originalSize: Int
    let cleanedSize: Int
    var issuesFound: [JSONIssue]
    var processingLog: [String]
}

enum JSONIssue {
    case duplicateField(String)
    case malformedDate(String)
    case invalidCharacters(String)
    case structuralIssue(String)
}

// MARK: - Concrete JSON Response Processor (Single Responsibility Principle)

class JSONResponseProcessor: JSONResponseProcessing {
    
    func processResponse(_ data: Data) -> ProcessedJSONResponse {
        var diagnostics = JSONDiagnostics(
            originalSize: data.count,
            cleanedSize: 0,
            issuesFound: [],
            processingLog: []
        )
        
        guard let originalString = String(data: data, encoding: .utf8) else {
            diagnostics.processingLog.append("❌ Failed to decode data as UTF-8")
            return ProcessedJSONResponse(
                cleanedData: data,
                originalData: data,
                diagnostics: diagnostics,
                isValid: false
            )
        }
        
        diagnostics.processingLog.append("✅ Successfully decoded as UTF-8")
        
        // First, check if this is valid JSON that doesn't need repair
        if let jsonData = originalString.data(using: .utf8),
           let _ = try? JSONSerialization.jsonObject(with: jsonData, options: []) {
            // Valid JSON - check if it's an error response or other non-user response
            if originalString.contains("\"error\"") || !originalString.contains("\"user\"") {
                diagnostics.processingLog.append("✅ Valid JSON detected (error or non-user response), returning unchanged")
                return ProcessedJSONResponse(
                    cleanedData: data,
                    originalData: data,
                    diagnostics: diagnostics,
                    isValid: true
                )
            }
        }
        
        // SYSTEMATIC APPROACH: Object-based field name repair (only for user responses)
        if let cleanedData = repairJSONObject(originalString, diagnostics: &diagnostics) {
            let isValid = validateJSONStructure(cleanedData, diagnostics: &diagnostics)
            
            diagnostics = JSONDiagnostics(
                originalSize: diagnostics.originalSize,
                cleanedSize: cleanedData.count,
                issuesFound: diagnostics.issuesFound,
                processingLog: diagnostics.processingLog
            )
            
            return ProcessedJSONResponse(
                cleanedData: cleanedData,
                originalData: data,
                diagnostics: diagnostics,
                isValid: isValid
            )
        } else {
            // Fallback to string-based cleaning
            diagnostics.processingLog.append("⚠️ Object repair failed, falling back to string cleaning")
            
            var cleanedString = cleanBasicStructure(originalString, diagnostics: &diagnostics)
            cleanedString = removeDuplicateFields(cleanedString, diagnostics: &diagnostics)
            cleanedString = fixDateFormatting(cleanedString, diagnostics: &diagnostics)
            
            let cleanedData = Data(cleanedString.utf8)
            let isValid = validateJSONStructure(cleanedData, diagnostics: &diagnostics)
            
            diagnostics = JSONDiagnostics(
                originalSize: diagnostics.originalSize,
                cleanedSize: cleanedData.count,
                issuesFound: diagnostics.issuesFound,
                processingLog: diagnostics.processingLog
            )
            
            return ProcessedJSONResponse(
                cleanedData: cleanedData,
                originalData: data,
                diagnostics: diagnostics,
                isValid: isValid
            )
        }
    }
    
    // MARK: - Object-Based JSON Repair (Systematic Approach)
    
    private func repairJSONObject(_ input: String, diagnostics: inout JSONDiagnostics) -> Data? {
        diagnostics.processingLog.append("🔧 Starting object-based JSON repair")
        
        // Step 1: Pre-clean the string for basic parsing
        var workingString = input
        workingString = workingString.replacingOccurrences(of: "\n", with: " ")
        workingString = workingString.replacingOccurrences(of: "\r", with: " ")
        
        // Step 2: Try to parse as JSON object
        guard let jsonData = workingString.data(using: .utf8),
              let jsonObject = try? JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any] else {
            diagnostics.processingLog.append("❌ Could not parse as JSON object")
            return nil
        }
        
        diagnostics.processingLog.append("✅ Successfully parsed as JSON object")
        
        // CRITICAL: Check if this is an error response - if so, return it unchanged
        if jsonObject["error"] != nil {
            diagnostics.processingLog.append("✅ Detected error response, returning unchanged")
            return jsonData
        }
        
        // Step 3: Fix the user object field names (only for non-error responses)
        guard var userObject = jsonObject["user"] as? [String: Any] else {
            diagnostics.processingLog.append("❌ Could not find user object")
            return nil
        }
        
        // Step 4: Systematic field name repairs
        let fieldMappings: [(corrupted: [String], correct: String)] = [
            (["user-name", "user name", "username"], "username"),
            (["echo_score", "echo score", "echoscore"], "echo_score"),
            (["email_verified", "email verified", "emailverified", " email_verified"], "email_verified"),
            (["is_active", "is active", "isactive"], "is_active"),
            (["created_at", "created at", "createdat", "c reated_at"], "created_at"),
            (["updated_at", "updated at", "updatedat", "updat-ed_at", "updat ed_at"], "updated_at"),
            (["last_login_at", "last login at", "lastloginat"], "last_login_at"),
            (["last_activity_date", "last activity date", "lastactivitydate", "last_ac-tivity_date", "last ac tivity_date"], "last_activity_date"),
            (["preferred_challenge_time", "preferred challenge time", "preferred_chal-lenge_time"], "preferred_challenge_time"),
            (["current_streak", "current streak", "currentstreak"], "current_streak"),
            (["first_name", "first name", "firstname"], "first_name"),
            (["last_name", "last name", "lastname"], "last_name"),
            (["avatar_url", "avatar url", "avatarurl"], "avatar_url"),
            (["bias_profile", "bias profile", "biasprofile"], "bias_profile"),
            (["deleted_at", "deleted at", "deletedat"], "deleted_at"),
            (["google_id", "google id", "googleid"], "google_id")
        ]
        
        var repairedUserObject: [String: Any] = [:]
        var repairLog: [String] = []
        
        // Process each key in the user object
        for (key, value) in userObject {
            var mappedKey = key
            var wasRepaired = false
            
            // Clean the key of common corruptions
            let cleanKey = key.trimmingCharacters(in: .whitespacesAndNewlines)
                             .replacingOccurrences(of: " ", with: "_")
                             .replacingOccurrences(of: "-", with: "_")
            
            // Find the correct mapping
            for mapping in fieldMappings {
                if mapping.corrupted.contains(cleanKey) || mapping.corrupted.contains(key) {
                    mappedKey = mapping.correct
                    wasRepaired = true
                    repairLog.append("🔧 \(key) → \(mappedKey)")
                    break
                }
            }
            
            repairedUserObject[mappedKey] = value
        }
        
        // Log repairs
        if !repairLog.isEmpty {
            diagnostics.issuesFound.append(.structuralIssue("Field name repairs: \(repairLog.count)"))
            for repair in repairLog {
                diagnostics.processingLog.append(repair)
            }
        }
        
        // Step 5: Create repaired JSON object
        var repairedObject = jsonObject
        repairedObject["user"] = repairedUserObject
        
        // Step 6: Serialize back to JSON
        guard let repairedData = try? JSONSerialization.data(withJSONObject: repairedObject, options: []) else {
            diagnostics.processingLog.append("❌ Could not serialize repaired object")
            return nil
        }
        
        diagnostics.processingLog.append("✅ Object-based repair completed successfully")
        
        // Validate critical fields are present
        let criticalFields = ["echo_score", "username", "email", "created_at", "updated_at"]
        for field in criticalFields {
            if repairedUserObject[field] != nil {
                diagnostics.processingLog.append("✅ Verified: \(field)")
            } else {
                diagnostics.processingLog.append("❌ Missing after repair: \(field)")
            }
        }
        
        return repairedData
    }
    
    // MARK: - Private Processing Methods (Open/Closed Principle - extensible)
    
    private func cleanBasicStructure(_ input: String, diagnostics: inout JSONDiagnostics) -> String {
        var result = input
        diagnostics.processingLog.append("🔧 Starting systematic JSON repair")
        
        // SYSTEMATIC FIX: The backend sends line breaks INSIDE field names and values
        // This corrupts the JSON structure fundamentally
        
        // Step 1A: Fix trailing newlines in field names (CRITICAL)
        // Pattern: "field_name\n": value becomes "field_name": value
        let trailingNewlinePattern = #""([^"]*)\n"\s*:"#
        if result.range(of: trailingNewlinePattern, options: .regularExpression) != nil {
            diagnostics.issuesFound.append(.structuralIssue("Trailing newlines in field names"))
            result = result.replacingOccurrences(of: trailingNewlinePattern, 
                                               with: "\"$1\":", 
                                               options: .regularExpression)
            diagnostics.processingLog.append("🔧 Fixed trailing newlines in field names")
        }
        
        // Step 1B: Fix newlines in middle of field names
        // Pattern: "field_name<newline>other": value becomes "field_nameother": value
        let middleNewlinePattern = #""([^"]*)\n([^"]*)"\s*:"#
        if result.range(of: middleNewlinePattern, options: .regularExpression) != nil {
            diagnostics.issuesFound.append(.structuralIssue("Newlines in middle of field names"))
            result = result.replacingOccurrences(of: middleNewlinePattern, 
                                               with: "\"$1$2\":", 
                                               options: .regularExpression)
            diagnostics.processingLog.append("🔧 Fixed newlines in middle of field names")
        }
        
        // Step 2: Fix missing colons between field and value (e.g., "token" "value" -> "token": "value")
        let missingColonPattern = #""([^"]+)"\s+"([^"]+)""#
        if result.range(of: missingColonPattern, options: .regularExpression) != nil {
            diagnostics.issuesFound.append(.structuralIssue("Missing colons between field and value"))
            result = result.replacingOccurrences(of: missingColonPattern, 
                                               with: "\"$1\": \"$2\"", 
                                               options: .regularExpression)
        }
        
        // Step 3: Clean remaining newlines and normalize whitespace
        result = result.replacingOccurrences(of: "\n", with: " ")
        result = result.replacingOccurrences(of: "\r", with: " ")
        result = result.replacingOccurrences(of: "\\s{2,}", with: " ", options: .regularExpression)
        
        // Step 4: Systematic field name repairs
        diagnostics.processingLog.append("🔧 Starting field name repairs")
        
        // 4A: Fix leading spaces in field names
        let leadingSpacePattern = #""\s+([a-z_]+)"\s*:"#
        if result.range(of: leadingSpacePattern, options: .regularExpression) != nil {
            diagnostics.issuesFound.append(.structuralIssue("Leading spaces in field names"))
            result = result.replacingOccurrences(of: leadingSpacePattern, 
                                               with: "\"$1\":", 
                                               options: .regularExpression)
            diagnostics.processingLog.append("🔧 Fixed leading spaces in field names")
        }
        
        // 4B: Fix spaces within field names  
        let spacesInFieldPattern = #""([a-z]+)\s+([a-z_]+)"\s*:"#
        if result.range(of: spacesInFieldPattern, options: .regularExpression) != nil {
            diagnostics.issuesFound.append(.structuralIssue("Spaces within field names"))
            result = result.replacingOccurrences(of: spacesInFieldPattern, 
                                               with: "\"$1$2\":", 
                                               options: .regularExpression)
            diagnostics.processingLog.append("🔧 Fixed spaces within field names")
        }
        
        // 4C: Fix hyphens within field names
        let hyphensInFieldPattern = #""([a-z]+)-([a-z_]+)"\s*:"#
        if result.range(of: hyphensInFieldPattern, options: .regularExpression) != nil {
            diagnostics.issuesFound.append(.structuralIssue("Hyphens within field names"))
            result = result.replacingOccurrences(of: hyphensInFieldPattern, 
                                               with: "\"$1$2\":", 
                                               options: .regularExpression)
            diagnostics.processingLog.append("🔧 Fixed hyphens within field names")
        }
        
        // 4D: Fix specific wrong field names
        if result.contains("\"user-name\"") || result.contains("\"username\"") {
            result = result.replacingOccurrences(of: "\"user-name\"", with: "\"username\"")
            result = result.replacingOccurrences(of: "\"username\"", with: "\"username\"")
            diagnostics.processingLog.append("🔧 Fixed user-name -> username")
        }
        
        // Step 5: Enhanced validation with pattern detection
        let criticalFields = ["echo_score", "username", "email", "created_at", "updated_at"]
        diagnostics.processingLog.append("🔍 Validating critical fields after repair:")
        
        for field in criticalFields {
            // Check for exact field name with proper format
            if result.contains("\"\(field)\":") {
                diagnostics.processingLog.append("✅ Perfect: \(field)")
            } else {
                // Check for corrupted versions that might still exist
                let variations = [
                    "\"\(field)\n\":",  // trailing newline
                    "\" \(field)\":",   // leading space
                    "\"\(field) \":",   // trailing space
                    "\"\(field)\"",     // missing colon (partial match)
                ]
                
                var foundVariation = false
                for variation in variations {
                    if result.contains(variation) {
                        diagnostics.processingLog.append("⚠️ Found corrupted \(field): \(variation)")
                        foundVariation = true
                        break
                    }
                }
                
                if !foundVariation {
                    diagnostics.processingLog.append("❌ Missing: \(field)")
                }
            }
        }
        
        diagnostics.processingLog.append("🔧 Systematic JSON repair completed")
        return result
    }
    
    private func removeDuplicateFields(_ input: String, diagnostics: inout JSONDiagnostics) -> String {
        var result = input
        
        // Specifically handle duplicate last_activity_date fields
        // Pattern: Find the second occurrence of last_activity_date
        let lastActivityPattern = #"(,\s*"last_activity_date"\s*:\s*"[^"]*")\s*(,\s*"last_activity_date"\s*:\s*"[^"]*")"#
        
        if let range = result.range(of: lastActivityPattern, options: .regularExpression) {
            diagnostics.issuesFound.append(.duplicateField("last_activity_date"))
            // Keep only the first occurrence, remove the second
            result = result.replacingOccurrences(of: lastActivityPattern, 
                                               with: "$1", 
                                               options: .regularExpression)
            diagnostics.processingLog.append("🔧 Removed duplicate last_activity_date field")
        }
        
        return result
    }
    
    private func fixDateFormatting(_ input: String, diagnostics: inout JSONDiagnostics) -> String {
        var result = input
        
        // Fix lowercase 'z' timezone indicators
        let lowercaseZPattern = #"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})z""#
        if result.range(of: lowercaseZPattern, options: .regularExpression) != nil {
            diagnostics.issuesFound.append(.malformedDate("Lowercase 'z' timezone indicator"))
            result = result.replacingOccurrences(of: lowercaseZPattern, 
                                               with: "$1Z\"", 
                                               options: .regularExpression)
            diagnostics.processingLog.append("🔧 Fixed lowercase 'z' timezone indicators")
        }
        
        return result
    }
    
    private func validateJSONStructure(_ data: Data, diagnostics: inout JSONDiagnostics) -> Bool {
        do {
            _ = try JSONSerialization.jsonObject(with: data, options: [])
            diagnostics.processingLog.append("✅ JSON structure validation passed")
            return true
        } catch {
            diagnostics.processingLog.append("❌ JSON structure validation failed: \(error)")
            return false
        }
    }
}

// MARK: - Logging Extensions

extension ProcessedJSONResponse {
    func logDiagnostics() {
        print("🔍 JSON Processing Diagnostics:")
        print("   Original size: \(diagnostics.originalSize) bytes")
        print("   Cleaned size: \(diagnostics.cleanedSize) bytes")
        print("   Valid: \(isValid ? "✅" : "❌")")
        
        if !diagnostics.issuesFound.isEmpty {
            print("   Issues found:")
            for issue in diagnostics.issuesFound {
                print("     - \(issue)")
            }
        }
        
        if !diagnostics.processingLog.isEmpty {
            print("   Processing log:")
            for logEntry in diagnostics.processingLog {
                print("     \(logEntry)")
            }
        }
        
        if !isValid {
            print("   ❌ Raw original data:")
            if let originalString = String(data: originalData, encoding: .utf8) {
                print("     \(originalString)")
            }
            print("   🔧 Cleaned data:")
            if let cleanedString = String(data: cleanedData, encoding: .utf8) {
                print("     \(cleanedString)")
            }
        }
    }
}