import SwiftUI

struct ChallengeContentView: View {
    let challenge: Challenge
    let onSubmit: (Any) -> Void
    
    @State private var selectedAnswer: String = ""
    @State private var textAnswer: String = ""
    @State private var selectedBiasIndicators: Set<String> = []
    @State private var showingSubmitConfirmation = false
    
    var body: some View {
        VStack(spacing: 24) {
            // Challenge type and difficulty indicator
            ChallengeHeaderView(challenge: challenge)
            
            // Challenge content
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(challenge.title)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text(challenge.description)
                        .font(.body)
                        .lineSpacing(4)
                    
                    Text(challenge.instructions)
                        .font(.callout)
                        .foregroundColor(.secondary)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    
                    // Type-specific content
                    switch challenge.type {
                    case .biasSwap:
                        if let articles = challenge.content.articles {
                            BiasSwapContentView(
                                articles: articles,
                                selectedIndicators: $selectedBiasIndicators
                            )
                        }
                        
                    case .logicPuzzle, .dataLiteracy:
                        if let question = challenge.content.question {
                            Text(question)
                                .font(.body)
                                .padding()
                                .background(Color(.systemBackground))
                                .cornerRadius(12)
                                .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
                        }
                        
                        if let options = challenge.content.options {
                            AnswerOptionsView(
                                options: options,
                                selectedAnswer: $selectedAnswer
                            )
                        }
                        
                    case .counterArgument, .synthesis:
                        if let prompt = challenge.content.prompt {
                            Text(prompt)
                                .font(.body)
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(12)
                        }
                        
                        if let references = challenge.content.referenceMaterial {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Reference Material:")
                                    .font(.headline)
                                ForEach(references, id: \.self) { reference in
                                    Text("• \(reference)")
                                        .font(.callout)
                                        .padding(.leading)
                                }
                            }
                        }
                        
                        FreeTextAnswerView(answer: $textAnswer)
                        
                    case .ethicalDilemma:
                        if let scenario = challenge.content.scenario {
                            EthicalDilemmaContentView(
                                scenario: scenario,
                                stakeholders: challenge.content.stakeholders ?? [],
                                considerations: challenge.content.considerations ?? []
                            )
                        }
                        
                        FreeTextAnswerView(answer: $textAnswer)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            
            // Submit button
            SubmitButton(
                isEnabled: isAnswerValid,
                onSubmit: handleSubmit
            )
        }
    }
    
    private var isAnswerValid: Bool {
        switch challenge.type {
        case .biasSwap:
            return !selectedBiasIndicators.isEmpty
        case .logicPuzzle, .dataLiteracy:
            return !selectedAnswer.isEmpty
        case .counterArgument, .synthesis, .ethicalDilemma:
            return textAnswer.split(separator: " ").count >= 50 // Minimum word count
        }
    }
    
    private func handleSubmit() {
        let answer: Any
        
        switch challenge.type {
        case .biasSwap:
            answer = Array(selectedBiasIndicators)
        case .logicPuzzle, .dataLiteracy:
            answer = selectedAnswer
        case .counterArgument, .synthesis, .ethicalDilemma:
            answer = textAnswer
        }
        
        onSubmit(answer)
    }
}

// MARK: - Supporting Views

struct ChallengeHeaderView: View {
    let challenge: Challenge
    
    var body: some View {
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
                        .fill(level <= challenge.difficulty.level ? Color.orange : Color.gray.opacity(0.3))
                        .frame(width: 8, height: 8)
                }
            }
            
            // Time estimate
            Label("\(challenge.estimatedTimeMinutes) min", systemImage: "clock")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct BiasSwapContentView: View {
    let articles: [BiasArticle]
    @Binding var selectedIndicators: Set<String>
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Articles to Compare")
                .font(.headline)
            
            ForEach(articles) { article in
                BiasArticleView(
                    article: article,
                    selectedIndicators: $selectedIndicators
                )
            }
        }
    }
}

struct BiasArticleView: View {
    let article: BiasArticle
    @Binding var selectedIndicators: Set<String>
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(article.title)
                        .font(.headline)
                        .lineLimit(isExpanded ? nil : 2)
                    
                    Text(article.source)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        isExpanded.toggle()
                    }
                }) {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(.blue)
                }
            }
            
            if isExpanded {
                Text(article.content)
                    .font(.body)
                    .lineSpacing(4)
                
                if let indicators = article.biasIndicators {
                    Text("Select bias indicators:")
                        .font(.caption)
                        .fontWeight(.medium)
                        .padding(.top, 8)
                    
                    FlowLayout(spacing: 8) {
                        ForEach(indicators, id: \.self) { indicator in
                            BiasIndicatorChip(
                                text: indicator,
                                isSelected: selectedIndicators.contains(indicator),
                                action: {
                                    if selectedIndicators.contains(indicator) {
                                        selectedIndicators.remove(indicator)
                                    } else {
                                        selectedIndicators.insert(indicator)
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

struct BiasIndicatorChip: View {
    let text: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(text)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.blue : Color(.systemGray5))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(16)
        }
    }
}

struct EthicalDilemmaContentView: View {
    let scenario: String
    let stakeholders: [String]
    let considerations: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Scenario")
                    .font(.headline)
                
                Text(scenario)
                    .font(.body)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
            }
            
            if !stakeholders.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Stakeholders")
                        .font(.headline)
                    
                    ForEach(stakeholders, id: \.self) { stakeholder in
                        Label(stakeholder, systemImage: "person.fill")
                            .font(.callout)
                    }
                }
            }
            
            if !considerations.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Key Considerations")
                        .font(.headline)
                    
                    ForEach(considerations, id: \.self) { consideration in
                        Label(consideration, systemImage: "lightbulb.fill")
                            .font(.callout)
                    }
                }
            }
        }
    }
}

struct SubmitButton: View {
    let isEnabled: Bool
    let onSubmit: () -> Void
    @State private var showingConfirmation = false
    
    var body: some View {
        Button(action: {
            showingConfirmation = true
        }) {
            Text("Submit Answer")
                .font(.headline)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding()
                .background(isEnabled ? Color.blue : Color.gray)
                .foregroundColor(.white)
                .cornerRadius(12)
        }
        .disabled(!isEnabled)
        .padding(.horizontal, 20)
        .confirmationDialog(
            "Submit your answer?",
            isPresented: $showingConfirmation,
            titleVisibility: .visible
        ) {
            Button("Submit") {
                onSubmit()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("You won't be able to change your answer after submitting.")
        }
    }
}

// MARK: - Common Input Views

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
            
            Text("\(answer.split(separator: " ").count) words")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(
            in: proposal.replacingUnspecifiedDimensions().width,
            subviews: subviews,
            spacing: spacing
        )
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(
            in: bounds.width,
            subviews: subviews,
            spacing: spacing
        )
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: result.positions[index].x + bounds.minX,
                                     y: result.positions[index].y + bounds.minY),
                         proposal: .unspecified)
        }
    }
    
    struct FlowResult {
        var size: CGSize = .zero
        var positions: [CGPoint] = []
        
        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var x: CGFloat = 0
            var y: CGFloat = 0
            var maxHeight: CGFloat = 0
            
            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)
                
                if x + size.width > maxWidth, x > 0 {
                    x = 0
                    y += maxHeight + spacing
                    maxHeight = 0
                }
                
                positions.append(CGPoint(x: x, y: y))
                x += size.width + spacing
                maxHeight = max(maxHeight, size.height)
            }
            
            self.size = CGSize(width: maxWidth, height: y + maxHeight)
        }
    }
} 