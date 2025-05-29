import SwiftUI

struct BiasAssessmentView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var currentQuestionIndex = 0
    @State private var answers: [Int] = []
    @State private var isCompleted = false
    
    private let questions = [
        BiasAssessmentQuestion(
            text: "I prefer news sources that align with my existing beliefs.",
            options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
        ),
        BiasAssessmentQuestion(
            text: "I actively seek out opposing viewpoints on controversial topics.",
            options: ["Never", "Rarely", "Sometimes", "Often", "Always"]
        ),
        BiasAssessmentQuestion(
            text: "When I encounter information that contradicts my beliefs, I:",
            options: ["Dismiss it immediately", "Feel uncomfortable", "Consider it briefly", "Examine it carefully", "Welcome the challenge"]
        ),
        BiasAssessmentQuestion(
            text: "I believe most political issues have clear right and wrong answers.",
            options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"]
        ),
        BiasAssessmentQuestion(
            text: "How often do you change your mind on important issues?",
            options: ["Never", "Very Rarely", "Occasionally", "Fairly Often", "Frequently"]
        )
    ]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                if !isCompleted {
                    // Progress indicator
                    ProgressView(value: Double(currentQuestionIndex), total: Double(questions.count))
                        .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                        .padding(.horizontal)
                    
                    Text("Question \(currentQuestionIndex + 1) of \(questions.count)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    // Question content
                    VStack(spacing: 20) {
                        Text(questions[currentQuestionIndex].text)
                            .font(.title3)
                            .fontWeight(.medium)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                        
                        VStack(spacing: 12) {
                            ForEach(0..<questions[currentQuestionIndex].options.count, id: \.self) { optionIndex in
                                Button(action: {
                                    selectAnswer(optionIndex)
                                }) {
                                    Text(questions[currentQuestionIndex].options[optionIndex])
                                        .font(.body)
                                        .multilineTextAlignment(.center)
                                        .frame(maxWidth: .infinity)
                                        .padding()
                                        .background(Color(.systemGray6))
                                        .cornerRadius(12)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    Spacer()
                } else {
                    BiasAssessmentResultView(answers: answers, onComplete: {
                        dismiss()
                    })
                }
            }
            .navigationTitle("Bias Assessment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func selectAnswer(_ answerIndex: Int) {
        if answers.count <= currentQuestionIndex {
            answers.append(answerIndex)
        } else {
            answers[currentQuestionIndex] = answerIndex
        }
        
        if currentQuestionIndex < questions.count - 1 {
            withAnimation(.easeInOut(duration: 0.3)) {
                currentQuestionIndex += 1
            }
        } else {
            withAnimation(.easeInOut(duration: 0.5)) {
                isCompleted = true
            }
        }
    }
}

struct BiasAssessmentQuestion {
    let text: String
    let options: [String]
}

struct BiasAssessmentResultView: View {
    let answers: [Int]
    let onComplete: () -> Void
    
    private var calculatedBias: Double {
        // Simple bias calculation - in real app this would be more sophisticated
        let sum = answers.reduce(0, +)
        let average = Double(sum) / Double(answers.count)
        return (average - 2.0) * 1.5 // Convert to -3 to +3 scale
    }
    
    private var biasLabel: String {
        switch calculatedBias {
        case -3.0..<(-1.5): return "Left-Leaning"
        case -1.5..<(-0.5): return "Slightly Left"
        case -0.5...0.5: return "Centrist"
        case 0.5..<1.5: return "Slightly Right"
        case 1.5...3.0: return "Right-Leaning"
        default: return "Balanced"
        }
    }
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)
            
            Text("Assessment Complete!")
                .font(.title)
                .fontWeight(.bold)
            
            VStack(spacing: 16) {
                Text("Your Bias Profile")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Text(biasLabel)
                    .font(.title2)
                    .fontWeight(.medium)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue.opacity(0.2))
                    .foregroundColor(.blue)
                    .cornerRadius(20)
                
                Text("This assessment helps us personalize your content to expose you to diverse perspectives and challenge your thinking.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            
            Spacer()
            
            Button(action: onComplete) {
                Text("Continue")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .padding(.horizontal)
        }
        .padding()
    }
} 