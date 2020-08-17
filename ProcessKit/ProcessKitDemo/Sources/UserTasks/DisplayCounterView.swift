//
//  DisplayCounterView.swift
//  ProcessCore
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import SwiftUI
import ProcessKit

struct DisplayCounterView : View {
    
    @EnvironmentObject
    var orchestrator: Orchestrator
    
    var token: Token
    
    var counter: Int {
        self.token.payload["counter"] as? Int ?? 0
    }
    
    var body: some View {
        VStack {
            Text("Counter: \(self.counter)")
            Spacer()
            Button(action: { self.orchestrator.advance(token: self.token) }) {
                Text("Continue")
            }
        }
        .padding()
        .navigationBarTitle("Counter")
    }
}
