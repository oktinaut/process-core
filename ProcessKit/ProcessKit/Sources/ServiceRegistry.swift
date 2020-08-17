//
//  ServiceTaskExecutor.swift
//  ProcessCore
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import Foundation
import Combine

public typealias ServiceHandler = (Token) -> AnyPublisher<Token, ProcessError>

public typealias ServiceRegistry = [ String : ServiceHandler ]
