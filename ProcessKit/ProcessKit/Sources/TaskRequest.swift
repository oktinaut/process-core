//
//  TaskRequest.swift
//  ProcessKit
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import JavaScriptCore

public struct TaskRequest {
    
    public var type: String
    public var id: String
    public var token: Token
    
    static func fromJS(value: JSValue) -> TaskRequest? {

        guard
            let dict = value.toDictionary(),
            let type = dict["type"] as? String,
            let id = dict["id"] as? String,
            let token = Token.fromJS(value: value.objectForKeyedSubscript("token")) else {
              
            return nil
        }
        
        return TaskRequest(type: type, id: id, token: token)
    }
}
