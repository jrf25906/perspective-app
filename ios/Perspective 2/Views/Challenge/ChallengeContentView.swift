import SwiftUI

struct ChallengeContentView: View {
    let challenge: Challenge
    let onSubmit: (String) -> Void
    
    @State private var selectedAnswer: String = ""
    @State private var showingSubmitConfirmation = false
    
    var body: some View {
        VStack(spacing: 24) {
            // Challenge type indicator
            HStack {
                Image(systemName: challenge.type.icon)
                    .foregroundColor(.blue)
                Text(challenge.type.displayName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Spacer()
                
                // Difficulty indicator
                HStack(spacing: 2) {
                    ForEach(1...5, id: \.self) { level in
                        Circle()
                            .fill(level <= challenge.difficultyLevel ? Color.orange : Color.gray.opacity(0.3))
                            .frame(width: 8, height: 8)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            // Challenge content
            VStack(alignment: .leading, spacing: 16) {
                Text(challenge.title)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(challenge.prompt)
                    .font(.body)
                    .lineSpacing(4)
                
                // Additional content based on challenge type
                if let content = challenge.content.articles, !content.isEmpty {
                    ArticleContentView(articles: content)
                }
                
                if let scenario = challenge.content.scenario {
                    ScenarioContentView(scenario: scenario)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
            
            // Answer options
            if let options = challenge.options {
                AnswerOptionsView(
                    options: options,
                    selectedAnswer: $selectedAnswer
                )
            } else {
                // Free text input for synthesis challenges
                FreeTextAnswerView(answer: $selectedAnswer)
            }
            
            // Submit button
            Button(action: {
                showingSubmitConfirmation = true
            }) {
                Text("Submit Answer")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(selectedAnswer.isEmpty ? Color.gray : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .disabled(selectedAnswer.isEmpty)
            .confirmationDialog(
                "Submit your answer?",
                isPresented: $showingSubmitConfirmation,
                titleVisibility: .visible
            ) {
                Button("Submit") {
                    onSubmit(selectedAnswer)
                }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text("You won't be able to change your answer after submitting.")
            }
        }
    }
}

struct AnswerOptionsView: View {
    let options: [ChallengeOption]
    @Binding var selectedAnswer: String
    
    var body: some View {
        VStack(spacing: 12) {
            ForEach(options) { option in
                Button(action: {
                    selectedAnswer = option.id
                }) {
                    HStack {
                        Text(option.text)
                            .font(.body)
                            .multilineTextAlignment(.leading)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        if selectedAnswer == option.id {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.blue)
                        } else {
                            Image(systemName: "circle")
                                .foregroundColor(.gray)
                        }
                    }
                    .padding()
                    .background(
                        selectedAnswer == option.id 
                            ? Color.blue.opacity(0.1) 
                            : Color(.systemGray6)
                    )
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(
                                selectedAnswer == option.id ? Color.blue : Color.clear,
                                lineWidth: 2
                            )
                    )
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
    }
}

struct FreeTextAnswerView: View {
    @Binding var answer: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Your Response")
                .font(.headline)
                .fontWeight(.medium)
            
            TextEditor(text: $answer)
                .frame(minHeight: 120)
                .padding(12)
                .background(Color(.systemGray6))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )
        }
    }
}

struct ArticleContentView: View {
    let articles: [NewsArticle]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Related Articles")
                .font(.headline)
                .fontWeight(.medium)
            
            ForEach(articles) { article in
                ArticleCardView(article: article)
            }
        }
    }
}

struct ArticleCardView: View {
    let article: NewsArticle
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(article.title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .lineLimit(isExpanded ? nil : 2)
                    
                    Text(article.source)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Bias indicator
                Text(article.biasLabel)
                    .font(.caption2)
                    .fontWeight(.medium)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(article.biasColor.opacity(0.2))
                    .foregroundColor(article.biasColor)
                    .cornerRadius(8)
            }
            
            if isExpanded {
                Text(article.content)
                    .font(.caption)
                    .lineLimit(5)
                    .foregroundColor(.secondary)
            }
            
            Button(action: {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isExpanded.toggle()
                }
            }) {
                Text(isExpanded ? "Show Less" : "Read More")
                    .font(.caption)
                    .foregroundColor(.blue)
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

struct ScenarioContentView: View {
    let scenario: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Scenario")
                .font(.headline)
                .fontWeight(.medium)
            
            Text(scenario)
                .font(.body)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
        }
    }
} 