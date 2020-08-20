//
//  SampleProcessView.swift
//  ProcessCore
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import SwiftUI
import ProcessKit

struct SampleProcessView : View {
    
    @Environment(\.presentationMode)
    private var presentationMode: Binding<PresentationMode>
    
    private var processURL: URL
    
    init() {
        self.processURL = Bundle.main.url(forResource: "sample", withExtension: "bpmn")!
    }
    
    var body: some View {
        ProcessView(
            viewModel: ProcessViewModel(
                processURL: self.processURL,
                startEvent: "default",
                serviceRegistry: serviceRegistry
            ),
            viewRegistry: viewRegistry
        )
            .onEnd { _ in
                self.presentationMode.wrappedValue.dismiss()
            }
    }
}
