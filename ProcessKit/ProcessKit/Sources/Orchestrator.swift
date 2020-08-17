//
//  Orchestrator.swift
//  ServiceApp
//
//  Created by Tim Okolowski on 07.08.20.
//  Copyright © 2020 Huf Secure Mobile. All rights reserved.
//

import Combine
import Foundation
import JavaScriptCore

public class Orchestrator : ObservableObject {
    
    @Published
    public var task: TaskRequest?
    
    public var onEnd: ((String) -> Void)?
    
    private var context: JSContext
    
    private var wrappedOrchestrator: JSValue?
    
    private let serviceRegistry: ServiceRegistry
    
    private var cancellables: [AnyCancellable] = []
    
    public init(processURL: URL, serviceRegistry: ServiceRegistry) {
        
        self.context = JSContext()

        self.serviceRegistry = serviceRegistry
        
        self.initializeContext(processURL: processURL)
    }
    
    private func initializeContext(processURL: URL) {
        
        let bundle = Bundle(for: type(of: self))
        
        guard
            let scriptURL = bundle.url(forResource: "process-core", withExtension: "js"),
            let script = try? String(contentsOf: scriptURL),
            let processData = try? String(contentsOf: processURL) else {
                
            print("Could not initialize Orchestrator")
                
            return
        }
        
        self.context.setObject(Token.self, forKeyedSubscript: "Token" as NSString)
        self.context.setObject(TaskRequest.self, forKeyedSubscript: "TaskRequest" as NSString)
        
        self.context.evaluateScript(script)
        
        let escapedProcessData = processData
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "")
            .replacingOccurrences(of: "\t", with: "")
            .replacingOccurrences(of: "\r", with: "")
        
        self.context.evaluateScript("this[\"process\"] = this.ProcessCore.parseProcess(\"\(escapedProcessData)\")")
        
        self.wrappedOrchestrator = self.context.evaluateScript("this.ProcessCore.createOrchestrator(this.process)")
        
        let taskHandler: @convention(block) (JSValue?) -> Void = { calledBackValue in
            
            guard let value = calledBackValue else {
                return
            }
            
            let task = TaskRequest.fromJS(value: value)
            
            self.task = task
            
            if
                let currentTask = task,
                currentTask.type == "service",
                let serviceTask = self.serviceRegistry[currentTask.id] {
                
                let result = serviceTask(currentTask.token)
                
                result
                    .first()
                    .sink(receiveCompletion: { completion in
                        
                        switch completion {
                        case .failure(let error):
                            self.advance(token: currentTask.token, error: error)
                        default: break
                        }
                        
                    }, receiveValue: { token in
                        self.advance(token: token)
                    })
                    .store(in: &self.cancellables)
            }
        }
        
        let taskCallback = JSValue(object: taskHandler, in: self.context)
        
        self.wrappedOrchestrator?.invokeMethod("addEventListener", withArguments: ["task", taskCallback!])
        
        let endHandler: @convention(block) (JSValue?) -> Void = { calledBackValue in
            
            guard let endEventName = calledBackValue?.toString() else {
                return
            }
            
            self.onEnd?(endEventName)
        }
        
        let endCallback = JSValue(object: endHandler, in: self.context)
        
        self.wrappedOrchestrator?.invokeMethod("addEventListener", withArguments: ["end", endCallback!])
    }
    
    public func start(event: String? = nil) {
        self.wrappedOrchestrator?.invokeMethod("start", withArguments: [])
    }
    
    public func advance(token: Token, error: ProcessError? = nil) {
        
        guard let value = token.toJS(context: self.context) else {
            return
        }
        
        if let error = error {
            
            let jsError = error.toJS(context: self.context)!
            
            self.wrappedOrchestrator?.invokeMethod("advance", withArguments: [value, jsError])
            
        } else {
            self.wrappedOrchestrator?.invokeMethod("advance", withArguments: [value])
        }
    }
}
