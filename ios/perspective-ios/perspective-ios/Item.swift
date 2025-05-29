//
//  Item.swift
//  perspective-ios
//
//  Created by James Farmer on 5/26/25.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
