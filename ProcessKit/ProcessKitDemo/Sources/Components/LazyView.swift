//
//  LazyView.swift
//  ProcessCore
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import SwiftUI

public struct LazyView<Content: View>: View {
    
    private let build: () -> Content
    
    public init(_ build: @autoclosure @escaping () -> Content) {
        self.build = build
    }
    
    public var body: Content {
        build()
    }
}
