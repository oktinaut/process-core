//
//  ServiceRegistry.swift
//  ProcessCore
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import Combine
import ProcessKit

extension ProcessError {
    static let never = ProcessError(message: "Never")
    static let invalidInitialCounter = ProcessError(message: "Initial counter value must be larger than 0.")
}

let serviceRegistry: ServiceRegistry = [
    "validate-counter": { token in
        
        guard let initialCounter = token.payload["initialCounter"] as? Int, initialCounter > 0 else {
            
            return Fail(outputType: Token.self, failure: .invalidInitialCounter)
                .eraseToAnyPublisher()
        }
        
        let nextToken = token.update(payload: [
            "counter": initialCounter
        ])
        
        return Just(nextToken)
            .delay(for: 1, scheduler: DispatchQueue.main)
            .mapError { _ in .never }
            .eraseToAnyPublisher()
    },
]
