//
//  Token.swift
//  ProcessKit
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import JavaScriptCore

public struct Token {
    
    public var instanceId: String
    public var id: String
    public var payload: [AnyHashable : Any]
    public var error: ProcessError?
    
    public func update(payload: [AnyHashable : Any]) -> Token {
        
        let updatedPayload = self.payload.merge(payload)
        
        let updatedToken = Token(instanceId: self.instanceId, id: self.id, payload: updatedPayload)
        
        return updatedToken
    }
    
    static func fromJS(value: JSValue) -> Token? {

        guard
            let dict = value.toDictionary(),
            let instanceId = dict["instanceId"] as? String,
            let id = dict["id"] as? String,
            let payload = dict["payload"] as? [AnyHashable : Any] else {
              
            return nil
        }
        
        if
            let jsError = value.objectForKeyedSubscript("error"),
            jsError.isUndefined == false,
            let errorMessage = jsError.objectForKeyedSubscript("message")?.toString() {
            
            let error = ProcessError(message: errorMessage)

            return Token(instanceId: instanceId,
                         id: id,
                         payload: payload,
                         error: error)
            
        } else {
            return Token(instanceId: instanceId,
                         id: id,
                         payload: payload)
        }
    }
    
    func toJS(context: JSContext) -> JSValue? {
        
        let value = JSValue(object: [
            "instanceId": self.instanceId,
            "id": self.id,
            "payload": self.payload
        ], in: context)
        
        return value
    }
}

extension Dictionary {
    
    func merge(_ dict: [Key : Value]) -> Dictionary {
        
        var merged: [Key : Value] = [:]
        
        for (key, value) in self {
            merged[key] = value
        }
        
        for (key, value) in dict {
            merged[key] = value
        }
        
        return merged
    }
}
