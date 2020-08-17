//
//  Token.swift
//  ProcessKit
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import JavaScriptCore

public struct Token {
    
    public var id: String
    public var payload: [AnyHashable : Any]
    public var error: ProcessError?
    
    public func update(payload: [AnyHashable : Any]) -> Token {
        
        let mutatedToken = Token(id: self.id, payload: payload)
        
        return mutatedToken
    }
    
    static func fromJS(value: JSValue) -> Token? {

        guard
            let dict = value.toDictionary(),
            let key = dict["id"] as? String,
            let payload = dict["payload"] as? [AnyHashable : Any] else {
              
            return nil
        }
        
        if
            let jsError = value.objectForKeyedSubscript("error"),
            let errorMessage = jsError.objectForKeyedSubscript("message")?.toString() {
            
            let error = ProcessError(message: errorMessage)

            return Token(id: key, payload: payload, error: error)
            
        } else {
            return Token(id: key, payload: payload)
        }
    }
    
    func toJS(context: JSContext) -> JSValue? {
        
        let value = JSValue(object: [
            "id": self.id,
            "payload": self.payload
        ], in: context)
        
        return value
    }
}