//
//  SetInitialCounterView.swift
//  ProcessCore
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import SwiftUI
import ProcessKit

struct SetInitialCounterView : View {
    
    var token: Token

    @EnvironmentObject
    private var orchestrator: Orchestrator
    
    @State
    private var initialCounter: String = "0"
    
    var body: some View {
        VStack {
            Text("Set inital counter value:")
            TextField("Value", text: self.$initialCounter)
            Spacer()
            Button(action: self.start) {
                Text("Start")
            }
        }
        .padding()
        .navigationBarTitle("Counter")
    }
    
    func start() {
        
        let nextToken = self.token.update(payload: [
            "initialCounter": Int(self.initialCounter) ?? 0
        ])
        
        self.orchestrator.advance(token: nextToken)
    }
}
