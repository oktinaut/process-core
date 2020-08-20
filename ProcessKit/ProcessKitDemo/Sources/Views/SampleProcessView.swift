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
    
    @State
    private var viewModel = ProcessViewModel(
        processURL: Bundle.main.url(forResource: "sample", withExtension: "bpmn")!,
        startEvent: "default",
        serviceRegistry: serviceRegistry
    )
    
    var body: some View {
        ProcessView(
            viewModel: self.viewModel,
            viewRegistry: viewRegistry
        )
            .onEnd { _ in
                self.presentationMode.wrappedValue.dismiss()
            }
    }
}
