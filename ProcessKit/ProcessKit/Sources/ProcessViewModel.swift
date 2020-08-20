//
//  ProcessViewModel.swift
//  ProcessKit
//
//  Created by Tim Okolowski on 20.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import Foundation

public class ProcessViewModel : ObservableObject, Identifiable {
    
    @Published
    var orchestrator: Orchestrator
    
    public init(processURL: URL,
                startEvent: String? = nil,
                serviceRegistry: ServiceRegistry
    ) {
        
        self.orchestrator = Orchestrator(processURL: processURL,
                                         serviceRegistry: serviceRegistry)
        
        self.orchestrator.start(event: startEvent)
    }
}
