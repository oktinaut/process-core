//
//  ProcessError.swift
//  ProcessKit
//
//  Created by Tim Okolowski on 14.08.20.
//  Copyright © 2020 Huf Secure Mobile GmbH. All rights reserved.
//

import JavaScriptCore

public struct ProcessError : Error {
    
    public var message: String
    
    public init(message: String) {
        self.message = message
    }
    
    func toJS(context: JSContext) -> JSValue? {
    
        let jsError = context.evaluateScript("new Error('\(self.message)')")!
        
        return jsError
    }
}

extension ProcessError : LocalizedError {
    
    public var errorDescription: String? {
        return self.message
    }
}
