//
//  ProcessViewModel.swift
//  ProcessKit
//
//  Created by Tim Okolowski on 20.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import Combine

public class ProcessViewModel : ObservableObject, Identifiable {
    
    @Published
    var orchestrator: Orchestrator
    
    private var cancellable: AnyCancellable?
    
    public init(processURL: URL,
                startEvent: String? = nil,
                serviceRegistry: ServiceRegistry,
                onTaskEntered: ((TaskRequest) -> ())? = nil
    ) {
        
        self.orchestrator = Orchestrator(processURL: processURL,
                                         serviceRegistry: serviceRegistry)
        
        self.orchestrator.start(event: startEvent)
        
        self.cancellable = self.orchestrator.$task.sink { task in
            
            if let task = task {
                onTaskEntered?(task)
            }
            
            DispatchQueue.main.async {
                self.objectWillChange.send()
            }
        }
    }
}
