//
//  DisplayResultsView.swift
//  ProcessCore
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import SwiftUI
import ProcessKit

struct DisplayResultsView : View {
    
    @EnvironmentObject
    var orchestrator: Orchestrator
    
    var token: Token
    
    var body: some View {
        VStack {
            Text("Done!")
            Spacer()
            Button(action: { self.orchestrator.advance(token: self.token) }) {
                Text("Finish")
            }
        }
        .padding()
        .navigationBarTitle("Results")
    }
}
