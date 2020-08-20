//
//  ProcessView.swift
//  ProcessCore
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import Combine
import SwiftUI

public struct ProcessView : View {
    
//    @ObservedObject
//    private var orchestrator: Orchestrator
    
    private var viewRegistry: ViewRegistry
    
//    public init(processURL: URL,
//                startEvent: String? = nil,
//                serviceRegistry: ServiceRegistry,
//                viewRegistry: ViewRegistry) {
//
//        self.orchestrator = Orchestrator(processURL: processURL,
//                                         serviceRegistry: serviceRegistry)
//
//        self.viewRegistry = viewRegistry
//
//        self.orchestrator.start(event: startEvent)
//    }
    
    @ObservedObject
    private var viewModel: ProcessViewModel
    
    public init(viewModel: ProcessViewModel, viewRegistry: ViewRegistry) {
        
        self.viewModel = viewModel
        
        self.viewRegistry = viewRegistry
    }
    
    public var body: some View {
        Group {
            self.renderUserTask()
        }
        .environmentObject(self.viewModel.orchestrator)
    }
    
    func renderUserTask() -> AnyView {
        
        guard
            let task = self.viewModel.orchestrator.task,
            let viewFactory = self.viewRegistry[task.id] else {
            
            return AnyView(VStack {
                EmptyView()
            })
        }
        
        return viewFactory(task.token)
    }
}

extension ProcessView {
    
    public func onEnd(_ onEndHandler: @escaping (String) -> Void) -> some View {
        
        self.viewModel.orchestrator.onEnd = onEndHandler
        
        return self
    }
}

struct ProcessView_Previews: PreviewProvider {
    
    static var previews: some View {
        EmptyView()
    }
}
